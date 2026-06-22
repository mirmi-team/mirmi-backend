import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { MailService } from './mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Room, EmailVerification])],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
