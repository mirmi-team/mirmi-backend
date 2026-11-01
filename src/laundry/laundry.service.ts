import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateLaundryDto, ReservationStatus } from './dto/create-laundry.dto';
import { Laundry } from './entities/laundry.entity';
import { LaundryRequest } from './entities/laundry-request.entity';
import { LaundryFixedSchedule } from './entities/laundry-fixed-schedule.entity';

export type ScheduleSlot = {
  machine_no: number;
  start_time: string;
  end_time: string;
  type: 'FIXED' | 'RESERVED' | 'OPEN';
  room_number: number | null;
  // FIXED 슬롯에 호실이 2개 배정된 경우에만 값이 있음 (그 외엔 null)
  room_number_2: number | null;
};

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function resolveDayCode(dateStr: string): string {
  const day = new Date(`${dateStr}T00:00:00`).getDay(); // 0=일 ... 6=토
  if (day === 0 || day === 6) return 'WEEKEND';
  return DAY_CODES[day];
}

@Injectable()
export class LaundryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Laundry)
    private readonly laundryRepo: Repository<Laundry>,
    @InjectRepository(LaundryRequest)
    private readonly requestRepo: Repository<LaundryRequest>,
    @InjectRepository(LaundryFixedSchedule)
    private readonly fixedScheduleRepo: Repository<LaundryFixedSchedule>,
  ) {}

  // 로그인한 유저의 방(room)을 통해 그 유저가 생활 중인 층을 조회
  async getUserFloor(userId: number): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { room: true },
    });

    if (!user || !user.room) {
      throw new NotFoundException('사용자의 방 정보를 찾을 수 없습니다.');
    }
    if (user.room.floor == null) {
      throw new NotFoundException('방에 층 정보가 설정되어 있지 않습니다.');
    }

    return user.room.floor;
  }

  // 특정 층의 세탁기들을 id 오름차순으로 가져와 1호,2호,3호... 순서로 매핑
  private async getFloorMachines(
    floor: number,
  ): Promise<{ id: number; machine_no: number }[]> {
    const machines = await this.laundryRepo.find({
      select: { id: true },
      where: { floor },
      order: { id: 'ASC' },
    });
    return machines.map((m, index) => ({ id: m.id, machine_no: index + 1 }));
  }

  // GET /laundry?floor=5 (floor 없으면 컨트롤러에서 로그인 유저의 층으로 채워서 넘겨줌)
  async findAllMachines(floor: number): Promise<Laundry[]> {
    return this.laundryRepo.find({
      where: { floor },
      order: { id: 'ASC' },
    });
  }

  // GET /laundry/schedule?date=YYYY-MM-DD&floor=5
  // 종이표와 동일한 요일별 고정 시간표 + 오픈 슬롯의 실제 예약 여부를 합쳐서 반환
  async getSchedule(floor: number, dateStr: string): Promise<ScheduleSlot[]> {
    const dayCode = resolveDayCode(dateStr);
    const floorMachines = await this.getFloorMachines(floor);
    const idByMachineNo = new Map(
      floorMachines.map((m) => [m.machine_no, m.id]),
    );
    const laundryIds = floorMachines.map((m) => m.id);

    const slots = await this.fixedScheduleRepo.find({
      where: { floor, day_of_week: dayCode },
      order: { start_time: 'ASC' },
    });

    let reservations: LaundryRequest[] = [];
    if (laundryIds.length > 0) {
      reservations = await this.requestRepo
        .createQueryBuilder('r')
        .where('r.laundry_id IN (:...laundryIds)', { laundryIds })
        .andWhere('r.status IN (:...statuses)', {
          statuses: [ReservationStatus.PENDING, ReservationStatus.IN_USE],
        })
        .andWhere('r.start_time >= :from', { from: `${dateStr}T00:00:00` })
        .andWhere('r.start_time < :to', { to: `${dateStr}T23:59:59` })
        .getMany();
    }

    return slots.map((slot) => {
      if (slot.assigned_room != null) {
        return {
          machine_no: slot.machine_no,
          start_time: slot.start_time,
          end_time: slot.end_time,
          type: 'FIXED',
          room_number: slot.assigned_room,
          room_number_2: slot.assigned_room_2 ?? null,
        };
      }

      const laundryId = idByMachineNo.get(slot.machine_no);
      const matched = reservations.find(
        (r) =>
          r.laundry_id === laundryId &&
          r.start_time.slice(11, 16) === slot.start_time.slice(0, 5) &&
          r.end_time.slice(11, 16) === slot.end_time.slice(0, 5),
      );

      return {
        machine_no: slot.machine_no,
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: matched ? 'RESERVED' : 'OPEN',
        room_number: matched ? matched.room_number : null,
        room_number_2: null,
      };
    });
  }

  // PATCH /admin/laundry/machines/:id
  async updateMachineStatus(
    id: number,
    dto: UpdateLaundryDto,
  ): Promise<{ message: string }> {
    const machine = await this.laundryRepo.findOne({
      select: { id: true },
      where: { id },
    });
    if (!machine) {
      throw new NotFoundException('해당 세탁기를 찾을 수 없습니다.');
    }

    await this.laundryRepo.update(id, { status: dto.status });

    return { message: '세탁기 상태가 변경되었습니다.' };
  }

  // POST /laundry/requests
  async createReservation(
    dto: CreateLaundryDto,
    userId: number,
  ): Promise<{ message: string; reservationId: number }> {
    const machine = await this.laundryRepo.findOne({
      select: { id: true, floor: true },
      where: { id: dto.laundry_id },
    });
    if (!machine) {
      throw new NotFoundException('해당 세탁기를 찾을 수 없습니다.');
    }

    if (new Date(dto.start_time) >= new Date(dto.end_time)) {
      throw new ConflictException('종료 시간은 시작 시간보다 이후여야 합니다.');
    }

    // 이 세탁기가 그 층에서 몇 호(1/2/3호)인지 찾기
    const floorMachines = await this.getFloorMachines(machine.floor);
    const machineNo = floorMachines.find(
      (m) => m.id === machine.id,
    )?.machine_no;

    // 요청 시간대가 종이표(고정 시간표)의 슬롯과 정확히 일치하는지 확인
    const startDate = dto.start_time.slice(0, 10);
    const startHHMM = dto.start_time.slice(11, 16);
    const endHHMM = dto.end_time.slice(11, 16);
    const dayCode = resolveDayCode(startDate);

    // machineNo가 undefined면 TypeORM where가 조건을 무시하므로 먼저 걸러낸다
    const slot =
      machineNo === undefined
        ? null
        : await this.fixedScheduleRepo.findOne({
            where: {
              floor: machine.floor,
              day_of_week: dayCode,
              machine_no: machineNo,
              start_time: `${startHHMM}:00`,
              end_time: `${endHHMM}:00`,
            },
          });

    if (!slot) {
      throw new BadRequestException(
        '해당 시간대는 세탁기 사용 시간표에 없는 시간입니다.',
      );
    }
    // 이 슬롯이 고정 배정(단독 또는 호실 2개 중 하나)인데, 신청자 호실이
    // 그 배정 호실 중 어디에도 해당하지 않으면 막습니다.
    if (
      slot.assigned_room != null &&
      slot.assigned_room !== dto.room_number &&
      slot.assigned_room_2 !== dto.room_number
    ) {
      throw new ForbiddenException(
        '해당 시간대는 다른 호실에 고정 배정된 시간입니다.',
      );
    }

    // 같은 세탁기에 시간이 겹치는 예약이 있는지 확인 (대기중/사용중인 예약만 대상)
    const overlapping = await this.requestRepo
      .createQueryBuilder('r')
      .select('r.id')
      .where('r.laundry_id = :laundryId', { laundryId: dto.laundry_id })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.IN_USE],
      })
      .andWhere('r.start_time < :end', { end: dto.end_time })
      .andWhere('r.end_time > :start', { start: dto.start_time })
      .limit(1)
      .getMany();

    if (overlapping.length > 0) {
      throw new ConflictException('해당 시간에 이미 예약이 존재합니다.');
    }

    const inserted = await this.requestRepo.save(
      this.requestRepo.create({
        laundry_id: dto.laundry_id,
        room_number: dto.room_number,
        start_time: dto.start_time,
        end_time: dto.end_time,
        status: ReservationStatus.PENDING, // 클라이언트 값 무시, 서버에서 고정
        user_id: userId,
      }),
    );

    return {
      message: '세탁 신청이 완료되었습니다.',
      reservationId: inserted.id,
    };
  }

  // GET /laundry/requests/me
  async findMyReservations(userId: number): Promise<LaundryRequest[]> {
    return this.requestRepo.find({
      where: { user_id: userId },
      order: { start_time: 'ASC' },
    });
  }

  // DELETE /laundry/reservations/:id
  async cancelReservation(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const reservation = await this.requestRepo.findOne({
      select: { id: true, user_id: true },
      where: { id },
    });
    if (!reservation) {
      throw new NotFoundException('해당 세탁 신청을 찾을 수 없습니다.');
    }
    if (reservation.user_id !== userId) {
      throw new ForbiddenException('본인의 신청만 취소할 수 있습니다.');
    }

    await this.requestRepo.update(id, { status: ReservationStatus.CANCELED });

    return { message: '세탁 신청이 취소되었습니다.' };
  }
}
