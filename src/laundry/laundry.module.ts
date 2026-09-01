import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaundryService } from './laundry.service';
import { LaundryController } from './laundry.controller';
import { LaundryAdminController } from './laundry-admin.controller';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [SupabaseModule, TypeOrmModule.forFeature([User])],
  controllers: [LaundryController, LaundryAdminController],
  providers: [LaundryService],
  exports: [LaundryService],
})
export class LaundryModule {}
