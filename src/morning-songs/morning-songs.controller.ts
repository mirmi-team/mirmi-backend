import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MorningSongsService } from './morning-songs.service';
import { CreateMorningSongDto } from './dto/create-morning-song.dto';
import { UpdateMorningSongDto } from './dto/update-morning-song.dto';

@Controller('morning-songs')
export class MorningSongsController {
  constructor(private readonly morningSongsService: MorningSongsService) {}

  @Post()
  create(@Body() createMorningSongDto: CreateMorningSongDto) {
    return this.morningSongsService.create(createMorningSongDto);
  }

  @Get()
  findAll() {
    return this.morningSongsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.morningSongsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMorningSongDto: UpdateMorningSongDto) {
    return this.morningSongsService.update(+id, updateMorningSongDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.morningSongsService.remove(+id);
  }
}
