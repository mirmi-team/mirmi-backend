import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Notice } from './entities/notice.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
  ) {}

  async findOne() {
    // 오늘 공지사항 조회
    // 오늘 00:00:00
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 내일 00:00:00 (오늘의 끝)
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 오늘 범위에 등록된 공지 찾기 (최신 1개)
    const notice = await this.noticeRepository.findOne({
      where: {
        created_at: Between(startOfDay, endOfDay),
      },
      order: { created_at: 'DESC' },
    });

    if (!notice) {
      return { message: '아직 오늘 공지사항이 올라오지 않았습니다.' };
    }

    return notice;
  }

  async create(dto: CreateNoticeDto) {
    const notice = this.noticeRepository.create(dto);
    return await this.noticeRepository.save(notice);
  }

  async update(id: number, dto: UpdateNoticeDto) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    Object.assign(notice, dto); // dto에 있는 파일만 notice에 덮어씀
    await this.noticeRepository.save(notice);
    return { message: '공지사항이 수정되었습니다.' };
  }

  async delete(id: number) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
    await this.noticeRepository.delete(id);

    return { message: '공지사항이 삭제되었습니다.' };
  }
}
