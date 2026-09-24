import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequestsService } from './return-requests.service';
import { ReturnRequestsController } from './return-requests.controller';
import { ReturnRequestsAdminController } from './return-requests-admin.controller';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [SupabaseModule, TypeOrmModule.forFeature([User])],
  controllers: [ReturnRequestsController, ReturnRequestsAdminController],
  providers: [ReturnRequestsService],
  exports: [ReturnRequestsService],
})
export class ReturnRequestsModule {}
