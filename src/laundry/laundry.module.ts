import { Module } from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { LaundryController } from './laundry.controller';
import { LaundryAdminController } from './laundry-admin.controller';
import { SupabaseModule } from 'src/common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [LaundryController, LaundryAdminController],
  providers: [LaundryService],
  exports: [LaundryService],
})
export class LaundryModule {}
