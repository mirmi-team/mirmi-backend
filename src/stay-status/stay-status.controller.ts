import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StayStatusService } from './stay-status.service';
import { CreateStayStatusDto } from './dto/create-stay-status.dto';
import { UpdateStayStatusDto } from './dto/update-stay-status.dto';

@Controller('stay-status')
export class StayStatusController {
  constructor(private readonly stayStatusService: StayStatusService) {}

  @Post()
  create(@Body() createStayStatusDto: CreateStayStatusDto) {
    return this.stayStatusService.create(createStayStatusDto);
  }

  @Get()
  findAll() {
    return this.stayStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stayStatusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStayStatusDto: UpdateStayStatusDto) {
    return this.stayStatusService.update(+id, updateStayStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stayStatusService.remove(+id);
  }
}
