import { Module } from '@nestjs/common';
import { StayStatusService } from './stay-status.service';
import { StayStatusController } from './stay-status.controller';

@Module({
  controllers: [StayStatusController],
  providers: [StayStatusService],
})
export class StayStatusModule {}
