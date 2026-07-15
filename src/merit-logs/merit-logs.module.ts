// src/merit-logs/merit-logs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeritLogsController } from './merit-logs.controller';
import { MeritLogsService } from './merit-logs.service';
import { MeritLog } from './entities/merit-log.entity';
import { MeritReason } from './entities/merit-reason.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeritLog, MeritReason, User])],
  controllers: [MeritLogsController],
  providers: [MeritLogsService],
})
export class MeritLogsModule {}
