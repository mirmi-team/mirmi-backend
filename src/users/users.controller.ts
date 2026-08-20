import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard) // ★ 이 줄이 토큰 검증을 강제
  getMe(@GetUser() user) {
    return this.usersService.findMe(user.id);
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@GetUser() user, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiResponse({ status: 200, description: '프로필 이미지 업로드 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      // 'image'라는 필드명으로 파일 받음. Supabase Storage로 업로드하므로 메모리에만 보관
      storage: memoryStorage(), // 메모리에 올렸다가 supabase로 업로드
    }),
  )
  uploadProfileImage(
    @GetUser() user,
    @UploadedFile() file: Express.Multer.File, //
  ) {
    return this.usersService.updateProfileImage(user.id, file);
  }
}
