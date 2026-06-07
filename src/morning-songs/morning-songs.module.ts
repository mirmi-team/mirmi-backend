import { Module } from '@nestjs/common';
import { MorningSongsService } from './morning-songs.service';
import { MorningSongsController } from './morning-songs.controller';

@Module({
  controllers: [MorningSongsController],
  providers: [MorningSongsService],
})
export class MorningSongsModule {}
