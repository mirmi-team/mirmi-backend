import { Injectable } from '@nestjs/common';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';

@Injectable()
export class ReturnRequestsService {
  create(createReturnRequestDto: CreateReturnRequestDto) {
    return 'This action adds a new returnRequest';
  }

  findAll() {
    return `This action returns all returnRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} returnRequest`;
  }

  update(id: number, updateReturnRequestDto: UpdateReturnRequestDto) {
    return `This action updates a #${id} returnRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} returnRequest`;
  }
}
