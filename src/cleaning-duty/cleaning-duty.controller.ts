import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CleaningDutyService } from './cleaning-duty.service';
import { CreateCleaningDutyDto } from './dto/create-cleaning-duty.dto';
import { UpdateCleaningDutyDto } from './dto/update-cleaning-duty.dto';

@Controller('cleaning-duty')
export class CleaningDutyController {
  constructor(private readonly cleaningDutyService: CleaningDutyService) {}

  @Post()
  create(@Body() createCleaningDutyDto: CreateCleaningDutyDto) {
    return this.cleaningDutyService.create(createCleaningDutyDto);
  }

  @Get()
  findAll() {
    return this.cleaningDutyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cleaningDutyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCleaningDutyDto: UpdateCleaningDutyDto) {
    return this.cleaningDutyService.update(+id, updateCleaningDutyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cleaningDutyService.remove(+id);
  }
}
