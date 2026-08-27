// src/stay-status/stay-status.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StayStatus, StayStatusType } from './entities/stay-status.entity';
import { CreateStayStatusDto } from './dto/create-stay-status.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StayStatusService {
  constructor(
    @InjectRepository(StayStatus)
    private stayStatusRepository: Repository<StayStatus>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 이번 주 잔류/외출 신청
  async create(dto: CreateStayStatusDto, userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    if (!user.can_staying) {
      throw new ForbiddenException('잔류 신청 대상자가 아닙니다.');
    }

    const week_start = this.getWeekStartKst();

    const exists = await this.stayStatusRepository.findOne({
      where: { user_id: userId, week_start },
    });
    if (exists) {
      throw new ConflictException('이번 주 신청 내역이 이미 존재합니다.');
    }

    const stayStatus = this.stayStatusRepository.create({
      user_id: userId,
      status: dto.status,
      week_start,
    });

    return await this.stayStatusRepository.save(stayStatus);
  }

  // 내 신청 내역 전체 조회 (최신순)
  async findMine(userId: number) {
    return await this.stayStatusRepository.find({
      where: { user_id: userId },
      order: { week_start: 'DESC' },
    });
  }

  // 관리자 - 주간 전체 학생 현황 조회
  async findByWeekForAdmin(week: string) {
    if (!week) {
      throw new BadRequestException('week 파라미터가 필요합니다.');
    }

    const records = await this.stayStatusRepository.find({
      where: { week_start: week },
    });

    const userIds = [...new Set(records.map((record) => record.user_id))];
    const users = userIds.length
      ? await this.userRepository.find({
          where: { id: In(userIds) },
          relations: { room: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const list = records.map((record) => {
      const user = userMap.get(record.user_id);
      return {
        id: record.id,
        user_id: record.user_id,
        username: user?.username ?? null,
        room_number: user?.room?.room_number ?? null,
        status: record.status,
        week_start: record.week_start,
        updated_at: record.updated_at,
      };
    });

    const summary = {
      STAY: records.filter((record) => record.status === StayStatusType.STAY)
        .length,
      OUTING: records.filter(
        (record) => record.status === StayStatusType.OUTING,
      ).length,
    };

    return { week_start: week, summary, list };
  }

  private getWeekStartKst(): string {
    const today = new Date();
    today.setHours(today.getHours() + 9);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    today.setDate(today.getDate() + diff);
    return today.toISOString().split('T')[0];
  }
}
