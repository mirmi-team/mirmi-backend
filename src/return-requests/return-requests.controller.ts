import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';

@Controller('return-requests')
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  @Post()
  create(@Body() createReturnRequestDto: CreateReturnRequestDto) {
    return this.returnRequestsService.create(createReturnRequestDto);
  }

  @Get()
  findAll() {
    return this.returnRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReturnRequestDto: UpdateReturnRequestDto) {
    return this.returnRequestsService.update(+id, updateReturnRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.returnRequestsService.remove(+id);
  }
}
