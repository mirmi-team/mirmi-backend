import { Module } from '@nestjs/common';
import { CleaningDutyService } from './cleaning-duty.service';
import { CleaningDutyController } from './cleaning-duty.controller';

@Module({
  controllers: [CleaningDutyController],
  providers: [CleaningDutyService],
})
export class CleaningDutyModule {}
