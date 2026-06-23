import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard) // ★ 이 줄이 토큰 검증을 강제
  getMe(@GetUser() user) {
    return user;
  }
}
