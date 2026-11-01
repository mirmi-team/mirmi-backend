import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CleaningDuty } from './entities/cleaning-duty.entity';

export interface CleaningDutyRow {
  id: number;
  room_number: number | null;
  duty_date: Date;
  status: string;
}

@Injectable()
export class CleaningDutyService {
  constructor(
    @InjectRepository(CleaningDuty)
    private readonly cleaningDutyRepository: Repository<CleaningDuty>,
  ) {}

  // GET /cleanings?duty_date=2026-05-14
  async findAll(dutyDate: string): Promise<CleaningDutyRow[]> {
    const startOfDay = new Date(`${dutyDate}T00:00:00`);
    const endOfDay = new Date(`${dutyDate}T23:59:59`);

    const duties = await this.cleaningDutyRepository.find({
      where: { duty_date: Between(startOfDay, endOfDay) },
      relations: { room: true },
      order: { duty_date: 'ASC' },
    });

    // 명세서 응답 형태에 맞추기 위해 room_id 대신 room_number를 내려준다
    return duties.map((d) => ({
      id: d.id,
      room_number: d.room?.room_number ?? null,
      duty_date: d.duty_date,
      status: d.status,
    }));
  }
}
