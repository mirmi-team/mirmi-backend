// src/stay-status/stay-status.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StayStatusService } from './stay-status.service';
import { StayStatusController } from './stay-status.controller';
import { StayStatus } from './entities/stay-status.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StayStatus, User])],
  controllers: [StayStatusController],
  providers: [StayStatusService],
})
export class StayStatusModule {}
