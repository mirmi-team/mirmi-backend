import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';

const CLEANING_DUTY_TABLE = 'cleaning_duty';
const ROOMS_TABLE = 'rooms';

export interface CleaningDutyRow {
  id: number;
  room_number: number | null;
  duty_date: string;
  status: string;
}

interface CleaningDutyRawRow {
  id: number;
  room_id: number;
  duty_date: string;
  status: string;
}

interface RoomRow {
  id: number;
  room_number: number;
}

// Supabase 클라이언트가 Database 타입 생성 없이 쓰이고 있어 응답이 전부 any로 잡힙니다.
// unknown을 거쳐 명시적으로 캐스팅하는 이 함수 경계를 통과시키면, 호출부에서는
// any가 아니라 T 타입으로 확정되어 no-unsafe-* 계열 eslint 규칙에 걸리지 않습니다.
function asRows<T>(value: unknown): T {
  return value as T;
}

@Injectable()
export class CleaningDutyService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
  }

  // GET /cleanings?duty_date=2026-05-14
  async findAll(dutyDate: string): Promise<CleaningDutyRow[]> {
    const startOfDay = `${dutyDate}T00:00:00`;
    const endOfDay = `${dutyDate}T23:59:59`;

    const { data, error } = await this.client
      .from(CLEANING_DUTY_TABLE)
      .select('id, room_id, duty_date, status')
      .gte('duty_date', startOfDay)
      .lte('duty_date', endOfDay)
      .order('duty_date', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const duties = asRows<CleaningDutyRawRow[]>(data);

    if (duties.length === 0) {
      return [];
    }

    // room_id -> room_number 매핑 (명세서 응답 형태에 맞추기 위해 rooms 테이블과 조인)
    const roomIds = [...new Set(duties.map((d) => d.room_id))];
    const { data: roomsData, error: roomsError } = await this.client
      .from(ROOMS_TABLE)
      .select('id, room_number')
      .in('id', roomIds);

    if (roomsError) {
      throw new InternalServerErrorException(roomsError.message);
    }
    const rooms = asRows<RoomRow[]>(roomsData);
    const roomNumberById = new Map(rooms.map((r) => [r.id, r.room_number]));

    return duties.map((d) => ({
      id: d.id,
      room_number: roomNumberById.get(d.room_id) ?? null,
      duty_date: d.duty_date,
      status: d.status,
    }));
  }
}
