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
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RoomsModule } from './rooms/rooms.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { ContactModule } from './contact/contact.module';

// Railway 내부 주소는 SSL이 필요 없으므로 DB_SSL=true일 때만 SSL을 사용한다
function buildTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    extra: {
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 300000),
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    },
  };
}

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
    RoomsModule,
    ContactModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    TypeOrmModule.forRoot(buildTypeOrmOptions()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
