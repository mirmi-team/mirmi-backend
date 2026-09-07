// src/merit-logs/merit-logs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeritLog, MeritType } from './entities/merit-log.entity';
import { MeritReason } from './entities/merit-reason.entity';
import { User } from '../users/entities/user.entity';
import { CreateMeritLogDto } from './dto/create-merit-log.dto';
import { SetMeritScoreDto } from './dto/set-merit-score.dto';

@Injectable()
export class MeritLogsService {
  constructor(
    @InjectRepository(MeritLog)
    private meritLogRepository: Repository<MeritLog>,
    @InjectRepository(MeritReason)
    private meritReasonRepository: Repository<MeritReason>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 사유 목록 조회
  async getReasons() {
    return await this.meritReasonRepository.find({
      order: { type: 'ASC' },
    });
  }

  // 사유 추가 (관리자)
  async addReason(type: string, reason: string, default_score: number) {
    const newReason = this.meritReasonRepository.create({
      type: type as any,
      reason,
      default_score,
    });
    return await this.meritReasonRepository.save(newReason);
  }

  // 사유 삭제 (관리자)
  async deleteReason(id: number) {
    const result = await this.meritReasonRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('사유를 찾을 수 없습니다.');
    }
    return { message: '사유가 삭제되었습니다.' };
  }

  // 상벌점 부여 (관리자) - 사유 포함
  async create(dto: CreateMeritLogDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.user_id },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // type에 따라 부호 결정 (PENALTY는 음수, REWARD는 양수) - score는 항상 절댓값으로 취급
    const signedScore =
      dto.type === MeritType.PENALTY
        ? -Math.abs(dto.score)
        : Math.abs(dto.score);

    // merit_logs에 기록
    const log = this.meritLogRepository.create({
      user_id: dto.user_id,
      type: dto.type,
      score: signedScore,
      reason: dto.reason,
    });
    await this.meritLogRepository.save(log);

    // total_merit_score 갱신
    user.total_merit_score += signedScore;
    await this.userRepository.save(user);

    return log;
  }

  // 상벌점 초기값 설정 (관리자) - 점수만
  async setScore(userId: number, dto: SetMeritScoreDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    user.total_merit_score = dto.score;
    await this.userRepository.save(user);

    return {
      message: '상벌점이 설정되었습니다.',
      total_merit_score: user.total_merit_score,
    };
  }

  // 내 상벌점 내역 조회 (사용자)
  async getMyLogs(userId: number) {
    return await this.meritLogRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // 내 누적 상벌점 조회 (사용자)
  async getMySummary(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return { total_merit_score: user.total_merit_score };
  }
}
