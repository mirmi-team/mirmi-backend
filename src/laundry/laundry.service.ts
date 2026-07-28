import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import {
  UpdateLaundryDto,
  LaundryMachineStatus,
} from './dto/update-laundry.dto';
import { CreateLaundryDto, ReservationStatus } from './dto/create-laundry.dto';

const MACHINES_TABLE = 'laundry';
const RESERVATIONS_TABLE = 'laundry_request';

// 별도 types 파일 없이, 이 서비스에서만 쓰는 행(row) 모양을 여기 지역적으로 정의
export interface LaundryMachineRow {
  id: number;
  status: LaundryMachineStatus;
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

// Supabase 클라이언트가 Database 타입 생성 없이 쓰이고 있어 응답이 전부 any로 잡힙니다.
// unknown을 거쳐 명시적으로 캐스팅하는 이 함수 경계를 통과시키면, 호출부에서는
// any가 아니라 T 타입으로 확정되어 no-unsafe-* 계열 eslint 규칙에 걸리지 않습니다.
function asRows<T>(value: unknown): T {
  return value as T;
}

@Injectable()
export class LaundryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
  }

  // GET /laundry
  async findAllMachines(): Promise<LaundryMachineRow[]> {
    const { data, error } = await this.client
      .from(MACHINES_TABLE)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return asRows<LaundryMachineRow[]>(data);
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
    const { data: machine, error: machineError } = await this.client
      .from(MACHINES_TABLE)
      .select('id')
      .eq('id', dto.laundry_id)
      .maybeSingle();

    if (machineError) {
      throw new InternalServerErrorException(machineError.message);
    }
    if (!machine) {
      throw new NotFoundException('해당 세탁기를 찾을 수 없습니다.');
    }

    if (new Date(dto.start_time) >= new Date(dto.end_time)) {
      throw new ConflictException('종료 시간은 시작 시간보다 이후여야 합니다.');
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
