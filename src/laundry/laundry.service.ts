import { Injectable } from '@nestjs/common';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';

@Injectable()
export class LaundryService {
  create(createLaundryDto: CreateLaundryDto) {
    return 'This action adds a new laundry';
  }

  findAll() {
    return `This action returns all laundry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} laundry`;
  }

  update(id: number, updateLaundryDto: UpdateLaundryDto) {
    return `This action updates a #${id} laundry`;
  }

  remove(id: number) {
    return `This action removes a #${id} laundry`;
  }
}
