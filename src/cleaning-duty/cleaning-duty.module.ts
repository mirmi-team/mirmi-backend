import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningDutyService } from './cleaning-duty.service';
import { CleaningDutyController } from './cleaning-duty.controller';
import { CleaningDuty } from './entities/cleaning-duty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CleaningDuty])],
  controllers: [CleaningDutyController],
  providers: [CleaningDutyService],
  exports: [CleaningDutyService],
})
export class CleaningDutyModule {}
