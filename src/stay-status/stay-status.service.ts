import { Injectable } from '@nestjs/common';
import { CreateStayStatusDto } from './dto/create-stay-status.dto';
import { UpdateStayStatusDto } from './dto/update-stay-status.dto';

@Injectable()
export class StayStatusService {
  create(createStayStatusDto: CreateStayStatusDto) {
    return 'This action adds a new stayStatus';
  }

  findAll() {
    return `This action returns all stayStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stayStatus`;
  }

  update(id: number, updateStayStatusDto: UpdateStayStatusDto) {
    return `This action updates a #${id} stayStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} stayStatus`;
  }
}
