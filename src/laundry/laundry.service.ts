import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { User } from 'src/users/entities/user.entity';
import {
  UpdateLaundryDto,
  LaundryMachineStatus,
} from './dto/update-laundry.dto';
import { CreateLaundryDto, ReservationStatus } from './dto/create-laundry.dto';

const MACHINES_TABLE = 'laundry';
const RESERVATIONS_TABLE = 'laundry_request';
const SCHEDULE_TABLE = 'laundry_fixed_schedule';

export interface LaundryMachineRow {
  id: number;
  status: LaundryMachineStatus;
  floor: number;
  created_at: string;
}

export interface LaundryReservationRow {
  id: number;
  laundry_id: number;
  user_id: number;
  room_number: number;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
}

interface FixedScheduleRow {
  id: number;
  floor: number;
  day_of_week: string;
  machine_no: number;
  start_time: string; // 'HH:MM:SS'
  end_time: string;
  assigned_room: number | null;
}

export type ScheduleSlot = {
  machine_no: number;
  start_time: string;
  end_time: string;
  type: 'FIXED' | 'RESERVED' | 'OPEN';
  room_number: number | null;
};

// Supabase 클라이언트가 Database 타입 생성 없이 쓰이고 있어 응답이 전부 any로 잡힙니다.
// unknown을 거쳐 명시적으로 캐스팅하는 이 함수 경계를 통과시키면, 호출부에서는
// any가 아니라 T 타입으로 확정되어 no-unsafe-* 계열 eslint 규칙에 걸리지 않습니다.
function asRows<T>(value: unknown): T {
  return value as T;
}

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function resolveDayCode(dateStr: string): string {
  const day = new Date(`${dateStr}T00:00:00`).getDay(); // 0=일 ... 6=토
  if (day === 0 || day === 6) return 'WEEKEND';
  return DAY_CODES[day];
}

@Injectable()
export class LaundryService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
  }

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
    const { data, error } = await this.client
      .from(MACHINES_TABLE)
      .select('id')
      .eq('floor', floor)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const machines = asRows<{ id: number }[]>(data);
    return machines.map((m, index) => ({ id: m.id, machine_no: index + 1 }));
  }

  // GET /laundry?floor=5 (floor 없으면 컨트롤러에서 로그인 유저의 층으로 채워서 넘겨줌)
  async findAllMachines(floor: number): Promise<LaundryMachineRow[]> {
    const { data, error } = await this.client
      .from(MACHINES_TABLE)
      .select('*')
      .eq('floor', floor)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return asRows<LaundryMachineRow[]>(data);
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

    const { data: slotsData, error: slotError } = await this.client
      .from(SCHEDULE_TABLE)
      .select('*')
      .eq('floor', floor)
      .eq('day_of_week', dayCode)
      .order('start_time', { ascending: true });

    if (slotError) {
      throw new InternalServerErrorException(slotError.message);
    }
    const slots = asRows<FixedScheduleRow[]>(slotsData);

    let reservations: LaundryReservationRow[] = [];
    if (laundryIds.length > 0) {
      const { data: resData, error: resError } = await this.client
        .from(RESERVATIONS_TABLE)
        .select('*')
        .in('laundry_id', laundryIds)
        .in('status', [ReservationStatus.PENDING, ReservationStatus.IN_USE])
        .gte('start_time', `${dateStr}T00:00:00`)
        .lt('start_time', `${dateStr}T23:59:59`);

      if (resError) {
        throw new InternalServerErrorException(resError.message);
      }
      reservations = asRows<LaundryReservationRow[]>(resData);
    }

    return slots.map((slot) => {
      if (slot.assigned_room != null) {
        return {
          machine_no: slot.machine_no,
          start_time: slot.start_time,
          end_time: slot.end_time,
          type: 'FIXED',
          room_number: slot.assigned_room,
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
      };
    });
  }

  // PATCH /admin/laundry/machines/:id
  async updateMachineStatus(
    id: number,
    dto: UpdateLaundryDto,
  ): Promise<{ message: string }> {
    const { data: machine, error: findError } = await this.client
      .from(MACHINES_TABLE)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }
    if (!machine) {
      throw new NotFoundException('해당 세탁기를 찾을 수 없습니다.');
    }

    const { error } = await this.client
      .from(MACHINES_TABLE)
      .update({ status: dto.status })
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: '세탁기 상태가 변경되었습니다.' };
  }

  // POST /laundry/requests
  async createReservation(
    dto: CreateLaundryDto,
    userId: number,
  ): Promise<{ message: string; reservationId: number }> {
    const { data: machineData, error: machineError } = await this.client
      .from(MACHINES_TABLE)
      .select('id, floor')
      .eq('id', dto.laundry_id)
      .maybeSingle();

    if (machineError) {
      throw new InternalServerErrorException(machineError.message);
    }
    const machine = asRows<{ id: number; floor: number } | null>(machineData);
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

    const { data: slotData, error: slotError } = await this.client
      .from(SCHEDULE_TABLE)
      .select('*')
      .eq('floor', machine.floor)
      .eq('day_of_week', dayCode)
      .eq('machine_no', machineNo)
      .eq('start_time', `${startHHMM}:00`)
      .eq('end_time', `${endHHMM}:00`)
      .maybeSingle();

    if (slotError) {
      throw new InternalServerErrorException(slotError.message);
    }
    const slot = asRows<FixedScheduleRow | null>(slotData);

    if (!slot) {
      throw new BadRequestException(
        '해당 시간대는 세탁기 사용 시간표에 없는 시간입니다.',
      );
    }
    if (slot.assigned_room != null && slot.assigned_room !== dto.room_number) {
      throw new ForbiddenException(
        '해당 시간대는 다른 호실에 고정 배정된 시간입니다.',
      );
    }

    // 같은 세탁기에 시간이 겹치는 예약이 있는지 확인 (대기중/사용중인 예약만 대상)
    const { data: overlapping, error: overlapError } = await this.client
      .from(RESERVATIONS_TABLE)
      .select('id')
      .eq('laundry_id', dto.laundry_id)
      .in('status', [ReservationStatus.PENDING, ReservationStatus.IN_USE])
      .lt('start_time', dto.end_time)
      .gt('end_time', dto.start_time)
      .limit(1);

    if (overlapError) {
      throw new InternalServerErrorException(overlapError.message);
    }
    if (overlapping && overlapping.length > 0) {
      throw new ConflictException('해당 시간에 이미 예약이 존재합니다.');
    }

    const { data: inserted, error } = await this.client
      .from(RESERVATIONS_TABLE)
      .insert({
        laundry_id: dto.laundry_id,
        room_number: dto.room_number,
        start_time: dto.start_time,
        end_time: dto.end_time,
        status: ReservationStatus.PENDING, // 클라이언트 값 무시, 서버에서 고정
        user_id: userId,
      })
      .select('id')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const insertedRow = asRows<{ id: number }>(inserted);

    return {
      message: '세탁 신청이 완료되었습니다.',
      reservationId: insertedRow.id,
    };
  }

  // GET /laundry/requests/me
  async findMyReservations(userId: number): Promise<LaundryReservationRow[]> {
    const { data, error } = await this.client
      .from(RESERVATIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return asRows<LaundryReservationRow[]>(data);
  }

  // DELETE /laundry/reservations/:id
  async cancelReservation(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const { data: reservation, error: findError } = await this.client
      .from(RESERVATIONS_TABLE)
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }
    if (!reservation) {
      throw new NotFoundException('해당 세탁 신청을 찾을 수 없습니다.');
    }
    if (reservation.user_id !== userId) {
      throw new ForbiddenException('본인의 신청만 취소할 수 있습니다.');
    }

    const { error } = await this.client
      .from(RESERVATIONS_TABLE)
      .update({ status: ReservationStatus.CANCELED })
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: '세탁 신청이 취소되었습니다.' };
  }
}
