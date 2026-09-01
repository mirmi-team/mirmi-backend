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

  async findOne() {
    // 오늘 공지사항 최근 1개 조회
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

  async findAll() {
    // 오늘 공지사항 전체 조회
    // 오늘 00:00:00
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 내일 00:00:00 (오늘의 끝)
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 오늘 범위에 등록된 공지 찾기 (최신 1개)
    const notice = await this.noticeRepository.find({
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

  async create(dto: CreateNoticeDto, file?: Express.Multer.File) {
    let image_url: string | null = null;

    if (file) {
      const fileName = `notice_${Date.now()}${extname(file.originalname)}`;
      const bucket = this.supabaseService.client.storage.from('notice-images');

      const { error } = await bucket.upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (error)
        throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);

      const {
        data: { publicUrl },
      } = bucket.getPublicUrl(fileName);
      image_url = publicUrl;
    }

    const notice = this.noticeRepository.create({ ...dto, image_url });
    return this.noticeRepository.save(notice);
  }

  async update(id: number, dto: UpdateNoticeDto, file?: Express.Multer.File) {
    const notice = await this.noticeRepository.findOneBy({ id });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');

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
      if (error)
        throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);

      const {
        data: { publicUrl },
      } = bucket.getPublicUrl(fileName);
      notice.image_url = publicUrl;
    }

    Object.assign(notice, dto);
    return this.noticeRepository.save(notice);
  }

  async delete(id: number) {
    const notice = await this.noticeRepository.findOneBy({ id });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');

    if (notice.image_url) {
      const fileName = notice.image_url.split('/').pop()!.split('?')[0];
      const bucket = this.supabaseService.client.storage.from('notice-images');
      await bucket.remove([fileName]);
    }

    await this.noticeRepository.delete(id);
    return { message: '삭제되었습니다.' };
  }
}
