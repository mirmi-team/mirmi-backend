import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Room, EmailVerification]),
    JwtModule.register({}),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtStrategy],
})
export class AuthModule {}
