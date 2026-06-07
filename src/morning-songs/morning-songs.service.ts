import { Injectable } from '@nestjs/common';
import { CreateMorningSongDto } from './dto/create-morning-song.dto';
import { UpdateMorningSongDto } from './dto/update-morning-song.dto';

@Injectable()
export class MorningSongsService {
  create(createMorningSongDto: CreateMorningSongDto) {
    return 'This action adds a new morningSong';
  }

  findAll() {
    return `This action returns all morningSongs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} morningSong`;
  }

  update(id: number, updateMorningSongDto: UpdateMorningSongDto) {
    return `This action updates a #${id} morningSong`;
  }

  remove(id: number) {
    return `This action removes a #${id} morningSong`;
  }
}
