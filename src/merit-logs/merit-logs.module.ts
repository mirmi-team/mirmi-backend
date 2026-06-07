import { Module } from '@nestjs/common';
import { MeritLogsService } from './merit-logs.service';
import { MeritLogsController } from './merit-logs.controller';

@Module({
  controllers: [MeritLogsController],
  providers: [MeritLogsService],
})
export class MeritLogsModule {}
