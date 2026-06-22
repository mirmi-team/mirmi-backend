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
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NoticesModule,
    SuggestionsModule,
    LaundryModule,
    CleaningDutyModule,
    MorningSongsModule,
    ReturnRequestsModule,
    StayStatusModule,
    MeritLogsModule,
    ScheduleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
