// src/morning-songs/morning-songs.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MorningSong } from './entities/morning-song.entity';
import { CreateMorningSongDto } from './dto/create-morning-song.dto';

export interface YoutubeSearchResult {
  title: string;
  youtube_url: string;
  thumbnail: string;
  channel: string;
}

interface YoutubeSearchApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { default: { url: string } };
  };
}

interface YoutubeSearchApiResponse {
  items: YoutubeSearchApiItem[];
}

@Injectable()
export class MorningSongsService {
  constructor(
    @InjectRepository(MorningSong)
    private morningSongRepository: Repository<MorningSong>,
    private configService: ConfigService,
  ) {}

  // 유튜브 노래 검색
  async search(q: string): Promise<YoutubeSearchResult[]> {
    if (!q) {
      throw new BadRequestException('검색어를 입력해주세요.');
    }

    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('q', q);
    url.searchParams.set('key', apiKey ?? '');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new InternalServerErrorException('유튜브 검색에 실패했습니다.');
    }

    const data = (await response.json()) as YoutubeSearchApiResponse;

    return data.items.map((item) => ({
      title: item.snippet.title,
      youtube_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.default.url,
      channel: item.snippet.channelTitle,
    }));
  }

  // 아침 노래 신청
  async create(dto: CreateMorningSongDto, userId: number) {
    const play_date = this.getTomorrowKst();

    const count = await this.morningSongRepository.count({
      where: { play_date },
    });

    const morningSong = this.morningSongRepository.create({
      user_id: userId,
      song_name: dto.song_name,
      youtube_url: dto.youtube_url,
      thumbnail: dto.thumbnail,
      play_date,
      play_order: count + 1,
    });

    return await this.morningSongRepository.save(morningSong);
  }

  // 내 신청 내역 조회
  async findMine(userId: number) {
    return await this.morningSongRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // 내 신청 삭제
  async remove(id: number, userId: number) {
    const morningSong = await this.morningSongRepository.findOne({
      where: { id },
    });
    if (!morningSong) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다.');
    }
    if (morningSong.user_id !== userId) {
      throw new ForbiddenException('본인이 신청한 곡만 삭제할 수 있습니다.');
    }

    await this.morningSongRepository.delete(id);
    return { message: '신청이 삭제되었습니다.' };
  }

  // 오늘 신청곡 조회 (KST 기준)
  async findToday() {
    const todayKst = this.getTodayKst();
    return await this.morningSongRepository.find({
      where: { play_date: todayKst }, 
      order: { created_at: 'ASC' },
    });
  }

  // 관리자 - 날짜별 신청 목록 조회
  async findByDateForAdmin(date: string) {
    if (!date) {
      throw new BadRequestException('date 파라미터가 필요합니다.');
    }

    return await this.morningSongRepository.find({
      where: { play_date: date },
      order: { created_at: 'ASC' },
    });
  }

  // 관리자 - 삭제
  async removeByAdmin(id: number) {
    const morningSong = await this.morningSongRepository.findOne({
      where: { id },
    });
    if (!morningSong) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다.');
    }

    await this.morningSongRepository.delete(id);
    return { message: '신청이 삭제되었습니다.' };
  }

  private getTodayKst(): string {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
  }

  private getTomorrowKst(): string {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 9); // KST
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
