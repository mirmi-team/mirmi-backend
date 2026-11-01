import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequestsService } from './return-requests.service';
import { ReturnRequestsController } from './return-requests.controller';
import { ReturnRequestsAdminController } from './return-requests-admin.controller';
import { User } from 'src/users/entities/user.entity';
import { ReturnRequest } from './entities/return-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ReturnRequest])],
  controllers: [ReturnRequestsController, ReturnRequestsAdminController],
  providers: [ReturnRequestsService],
  exports: [ReturnRequestsService],
})
export class ReturnRequestsModule {}
