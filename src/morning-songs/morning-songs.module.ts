// src/morning-songs/morning-songs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MorningSongsService } from './morning-songs.service';
import { MorningSongsController } from './morning-songs.controller';
import { MorningSong } from './entities/morning-song.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MorningSong])],
  controllers: [MorningSongsController],
  providers: [MorningSongsService],
})
export class MorningSongsModule {}
