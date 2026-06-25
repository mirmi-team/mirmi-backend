import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // 오늘 공지사항 조회 - 누구나 가능
  @Get('findOne')
  findOne() {
    return this.noticesService.findOne();
  }

  //등록 - 관리자만
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  create(@Body() dto: CreateNoticeDto) {
    return this.noticesService.create(dto);
  }

  //수정 - 관리자만
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.update(+id, dto);
  }
}
