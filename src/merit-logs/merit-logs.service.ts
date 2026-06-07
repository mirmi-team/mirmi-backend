import { Injectable } from '@nestjs/common';
import { CreateMeritLogDto } from './dto/create-merit-log.dto';
import { UpdateMeritLogDto } from './dto/update-merit-log.dto';

@Injectable()
export class MeritLogsService {
  create(createMeritLogDto: CreateMeritLogDto) {
    return 'This action adds a new meritLog';
  }

  findAll() {
    return `This action returns all meritLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meritLog`;
  }

  update(id: number, updateMeritLogDto: UpdateMeritLogDto) {
    return `This action updates a #${id} meritLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} meritLog`;
  }
}
