import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Notice } from './entities/notice.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { extname } from 'path';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    private readonly supabaseService: SupabaseService,
  ) {}

  // 한국 시간(KST) 기준 오늘 [00:00:00, 내일 00:00:00) 범위. 서버 TZ와 무관하다.
  private getKstTodayRange() {
    const koreaDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const startOfDay = new Date(`${koreaDate}T00:00:00+09:00`);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return { startOfDay, endOfDay };
  }

  async findOne() {
    // 오늘(KST) 등록된 공지사항 중 최신 1개 조회
    const { startOfDay, endOfDay } = this.getKstTodayRange();

    const notice = await this.noticeRepository.findOne({
      where: {
        created_at: Between(startOfDay, endOfDay),
      },
      order: {
        created_at: 'DESC',
        id: 'DESC',
      },
    });

    if (!notice) {
      return {
        message: '아직 오늘 공지사항이 올라오지 않았습니다.',
      };
    }

    return notice;
  }

  async findAll() {
    // 오늘(KST) 등록된 공지사항 전체 조회
    const { startOfDay, endOfDay } = this.getKstTodayRange();

    const notices = await this.noticeRepository.find({
      where: {
        created_at: Between(startOfDay, endOfDay),
      },
      order: {
        created_at: 'DESC',
        id: 'DESC',
      },
    });

    if (notices.length === 0) {
      return {
        message: '아직 오늘 공지사항이 올라오지 않았습니다.',
      };
    }

    return notices;
  }

  async findAllForAdmin(page: number, limit: number) {
    // 관리자용: 전체 기간, 최신순 페이지네이션
    const [items, total] = await this.noticeRepository.findAndCount({
      order: {
        created_at: 'DESC',
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async create(dto: CreateNoticeDto, file?: Express.Multer.File) {
    let image_url: string | null = null;

    if (file) {
      const fileName = `notice_${Date.now()}${extname(file.originalname)}`;
      const bucket = this.supabaseService.client.storage.from('notice-images');

      const { error } = await bucket.upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

      if (error) {
        throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = bucket.getPublicUrl(fileName);

      image_url = publicUrl;
    }

    const notice = this.noticeRepository.create({
      ...dto,
      image_url,
    });

    return this.noticeRepository.save(notice);
  }

  async update(id: number, dto: UpdateNoticeDto, file?: Express.Multer.File) {
    const notice = await this.noticeRepository.findOneBy({ id });

    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    if (file) {
      const bucket = this.supabaseService.client.storage.from('notice-images');

      if (notice.image_url) {
        const oldFileName = notice.image_url.split('/').pop()!.split('?')[0];

        await bucket.remove([oldFileName]);
      }

      const fileName = `notice_${Date.now()}${extname(file.originalname)}`;

      const { error } = await bucket.upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

      if (error) {
        throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = bucket.getPublicUrl(fileName);

      notice.image_url = publicUrl;
    }

    Object.assign(notice, dto);

    await this.noticeRepository.save(notice);

    return {
      message: '공지사항이 수정되었습니다.',
    };
  }

  async delete(id: number) {
    const notice = await this.noticeRepository.findOneBy({ id });

    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    if (notice.image_url) {
      const fileName = notice.image_url.split('/').pop()!.split('?')[0];

      const bucket = this.supabaseService.client.storage.from('notice-images');

      await bucket.remove([fileName]);
    }

    await this.noticeRepository.delete(id);

    return {
      message: '공지사항이 삭제되었습니다.',
    };
  }
}
