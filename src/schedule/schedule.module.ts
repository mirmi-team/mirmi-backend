import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleAdminController } from './schedule-admin.controller';
import { Schedule } from './entities/schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule])],
  controllers: [ScheduleController, ScheduleAdminController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
