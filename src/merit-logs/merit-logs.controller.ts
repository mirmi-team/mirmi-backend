import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MeritLogsService } from './merit-logs.service';
import { CreateMeritLogDto } from './dto/create-merit-log.dto';
import { UpdateMeritLogDto } from './dto/update-merit-log.dto';

@Controller('merit-logs')
export class MeritLogsController {
  constructor(private readonly meritLogsService: MeritLogsService) {}

  @Post()
  create(@Body() createMeritLogDto: CreateMeritLogDto) {
    return this.meritLogsService.create(createMeritLogDto);
  }

  @Get()
  findAll() {
    return this.meritLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meritLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeritLogDto: UpdateMeritLogDto) {
    return this.meritLogsService.update(+id, updateMeritLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meritLogsService.remove(+id);
  }
}
