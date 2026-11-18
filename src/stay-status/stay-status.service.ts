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
import { User, UserRole } from 'src/users/entities/user.entity';

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
      parent_phone: dto.parent_phone,
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

    const submitted = records.map((record) => {
      const user = userMap.get(record.user_id);
      return {
        id: record.id,
        user_id: record.user_id,
        username: user?.username ?? null,
        room_number: user?.room?.room_number ?? null,
        status: record.status,
        // 사감이 잔류 학생 보호자에게 연락할 수 있어야 한다.
        parent_phone: record.parent_phone,
        week_start: record.week_start,
        updated_at: record.updated_at,
      };
    });

    // 잔류 신청 대상(학생 + can_staying)인데 이번 주에 아직 신청하지 않은 학생.
    // 방 미배정 학생도 room_number null로 포함한다.
    const submittedUserIds = new Set(userIds);
    const targets = await this.userRepository.find({
      where: { role: UserRole.STUDENT, can_staying: true },
      relations: { room: true },
    });
    const notSubmitted = targets
      .filter((user) => !submittedUserIds.has(user.id))
      .sort((a, b) => {
        const roomA = a.room?.room_number ?? Number.MAX_SAFE_INTEGER;
        const roomB = b.room?.room_number ?? Number.MAX_SAFE_INTEGER;
        return roomA - roomB || a.id - b.id;
      })
      .map((user) => ({
        id: null,
        user_id: user.id,
        username: user.username,
        room_number: user.room?.room_number ?? null,
        status: null,
        parent_phone: null,
        week_start: week,
        updated_at: null,
      }));

    // 신청 학생이 먼저, 미신청 학생은 방 번호순으로 뒤에 붙인다.
    const list: ((typeof submitted)[number] | (typeof notSubmitted)[number])[] =
      [...submitted, ...notSubmitted];

    const summary = {
      STAY: records.filter((record) => record.status === StayStatusType.STAY)
        .length,
      OUTING: records.filter(
        (record) => record.status === StayStatusType.OUTING,
      ).length,
      NOT_SUBMITTED: notSubmitted.length,
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
