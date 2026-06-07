import { Module } from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { LaundryController } from './laundry.controller';

@Module({
  controllers: [LaundryController],
  providers: [LaundryService],
})
export class LaundryModule {}
