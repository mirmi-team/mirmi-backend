import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaundryService } from './laundry.service';
import { LaundryController } from './laundry.controller';
import { LaundryAdminController } from './laundry-admin.controller';
import { User } from 'src/users/entities/user.entity';
import { Laundry } from './entities/laundry.entity';
import { LaundryRequest } from './entities/laundry-request.entity';
import { LaundryFixedSchedule } from './entities/laundry-fixed-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Laundry,
      LaundryRequest,
      LaundryFixedSchedule,
    ]),
  ],
  controllers: [LaundryController, LaundryAdminController],
  providers: [LaundryService],
  exports: [LaundryService],
})
export class LaundryModule {}
