import { Module } from '@nestjs/common';
import { ReturnRequestsService } from './return-requests.service';
import { ReturnRequestsController } from './return-requests.controller';

@Module({
  controllers: [ReturnRequestsController],
  providers: [ReturnRequestsService],
})
export class ReturnRequestsModule {}
