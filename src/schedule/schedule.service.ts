import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  // GET /schedules
  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      order: { schedule_date: 'ASC' },
    });
  }

  // GET /schedules/:id
  async findOne(id: number): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('해당 일정을 찾을 수 없습니다.');
    }
    return schedule;
  }

  // POST /admin/schedules
  async create(
    dto: CreateScheduleDto,
  ): Promise<{ message: string; scheduleId: number }> {
    const inserted = await this.scheduleRepository.save(
      this.scheduleRepository.create({
        title: dto.title,
        description: dto.description,
        schedule_date: dto.schedule_date,
      }),
    );

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
    await this.findOne(id);
    await this.scheduleRepository.update(id, dto);

    return { message: '일정이 수정되었습니다.' };
  }

  // DELETE /admin/schedules/:id
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.scheduleRepository.delete(id);

    return { message: '일정이 삭제되었습니다.' };
  }
}
