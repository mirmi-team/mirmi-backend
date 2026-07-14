import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard) // ★ 이 줄이 토큰 검증을 강제
  getMe(@GetUser() user) {
    return this.usersService.findMe(user.id);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@GetUser() user, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Patch('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      // 'image'라는 필드명으로 파일 받음. Supabase Storage로 업로드하므로 메모리에만 보관
      storage: memoryStorage(),
    }),
  )
  uploadProfileImage(
    @GetUser() user,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(user.id, file);
  }
}
