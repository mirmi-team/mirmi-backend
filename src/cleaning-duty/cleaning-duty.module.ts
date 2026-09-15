import { Module } from '@nestjs/common';
import { CleaningDutyService } from './cleaning-duty.service';
import { CleaningDutyController } from './cleaning-duty.controller';
import { SupabaseModule } from 'src/common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CleaningDutyController],
  providers: [CleaningDutyService],
  exports: [CleaningDutyService],
})
export class CleaningDutyModule {}
