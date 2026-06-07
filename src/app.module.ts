import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NoticesModule } from './notices/notices.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { LaundryModule } from './laundry/laundry.module';
import { CleaningDutyModule } from './cleaning-duty/cleaning-duty.module';
import { MorningSongsModule } from './morning-songs/morning-songs.module';
import { ReturnRequestsModule } from './return-requests/return-requests.module';
import { StayStatusModule } from './stay-status/stay-status.module';
import { MeritLogsModule } from './merit-logs/merit-logs.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [AuthModule, UsersModule, NoticesModule, SuggestionsModule, LaundryModule, CleaningDutyModule, MorningSongsModule, ReturnRequestsModule, StayStatusModule, MeritLogsModule, ScheduleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
