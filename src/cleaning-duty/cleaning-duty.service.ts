import { Injectable } from '@nestjs/common';
import { CreateCleaningDutyDto } from './dto/create-cleaning-duty.dto';
import { UpdateCleaningDutyDto } from './dto/update-cleaning-duty.dto';

@Injectable()
export class CleaningDutyService {
  create(createCleaningDutyDto: CreateCleaningDutyDto) {
    return 'This action adds a new cleaningDuty';
  }

  findAll() {
    return `This action returns all cleaningDuty`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cleaningDuty`;
  }

  update(id: number, updateCleaningDutyDto: UpdateCleaningDutyDto) {
    return `This action updates a #${id} cleaningDuty`;
  }

  remove(id: number) {
    return `This action removes a #${id} cleaningDuty`;
  }
}
