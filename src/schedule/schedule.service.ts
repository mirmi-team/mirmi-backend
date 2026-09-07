import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

const SCHEDULE_TABLE = 'dormitory_schedule';

export interface ScheduleRow {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

// Supabase 클라이언트가 Database 타입 생성 없이 쓰이고 있어 응답이 전부 any로 잡힙니다.
// unknown을 거쳐 명시적으로 캐스팅하는 이 함수 경계를 통과시키면, 호출부에서는
// any가 아니라 T 타입으로 확정되어 no-unsafe-* 계열 eslint 규칙에 걸리지 않습니다.
function asRows<T>(value: unknown): T {
  return value as T;
}

@Injectable()
export class ScheduleService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
  }

  // GET /schedules
  async findAll(): Promise<ScheduleRow[]> {
    const { data, error } = await this.client
      .from(SCHEDULE_TABLE)
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return asRows<ScheduleRow[]>(data);
  }

  // GET /schedules/:id
  async findOne(id: number): Promise<ScheduleRow> {
    const { data, error } = await this.client
      .from(SCHEDULE_TABLE)
      .select('id, title, description, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const schedule = asRows<ScheduleRow | null>(data);
    if (!schedule) {
      throw new NotFoundException('해당 일정을 찾을 수 없습니다.');
    }
    return schedule;
  }

  // POST /admin/schedules
  async create(
    dto: CreateScheduleDto,
  ): Promise<{ message: string; scheduleId: number }> {
    const { data, error } = await this.client
      .from(SCHEDULE_TABLE)
      .insert({
        title: dto.title,
        description: dto.description,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const inserted = asRows<{ id: number }>(data);

    return {
      message: '일정이 등록되었습니다.',
      scheduleId: inserted.id,
    };
  }

  // PATCH /admin/schedules/:id
  async update(
    id: number,
    dto: UpdateScheduleDto,
  ): Promise<{ message: string }> {
    const { data: existing, error: findError } = await this.client
      .from(SCHEDULE_TABLE)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }
    if (!existing) {
      throw new NotFoundException('해당 일정을 찾을 수 없습니다.');
    }

    const { error } = await this.client
      .from(SCHEDULE_TABLE)
      .update(dto)
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: '일정이 수정되었습니다.' };
  }

  // DELETE /admin/schedules/:id
  async remove(id: number): Promise<{ message: string }> {
    const { data: existing, error: findError } = await this.client
      .from(SCHEDULE_TABLE)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }
    if (!existing) {
      throw new NotFoundException('해당 일정을 찾을 수 없습니다.');
    }

    const { error } = await this.client
      .from(SCHEDULE_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: '일정이 삭제되었습니다.' };
  }
}
