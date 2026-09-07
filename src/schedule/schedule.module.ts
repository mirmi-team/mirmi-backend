import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleAdminController } from './schedule-admin.controller';
import { SupabaseModule } from 'src/common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ScheduleController, ScheduleAdminController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
