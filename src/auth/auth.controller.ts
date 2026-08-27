import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @Post('signup')
  signup(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: '이메일 인증번호 발송' })
  @ApiResponse({ status: 201, description: '인증번호 발송 성공' })
  @Post('email/send')
  sendEmail(@Body() dto: SendEmailDto) {
    return this.authService.sendVerificationCode(dto.email);
  }

  @ApiOperation({ summary: '이메일 인증번호 확인' })
  @ApiResponse({ status: 201, description: '이메일 인증 성공' })
  @Post('email/verify')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyCode(dto.email, dto.code);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공 (accessToken, refreshToken 발급)',
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'accessToken 재발급' })
  @ApiResponse({ status: 201, description: '토큰 재발급 성공' })
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 201, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@GetUser() user) {
    return this.authService.logout(user.id);
  }

  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 201, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('quit')
  @UseGuards(JwtAuthGuard)
  quit(@GetUser() user) {
    return this.authService.quit(user.id);
  }
}
