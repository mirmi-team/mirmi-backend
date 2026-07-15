// src/merit-logs/merit-logs.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MeritLogsService } from './merit-logs.service';
import { CreateMeritLogDto } from './dto/create-merit-log.dto';
import { SetMeritScoreDto } from './dto/set-merit-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('merit-logs')
export class MeritLogsController {
  constructor(private readonly meritLogsService: MeritLogsService) {}

  // 사유 목록 조회 (누구나)
  @Get('reasons')
  getReasons() {
    return this.meritLogsService.getReasons();
  }

  // 사유 추가 (관리자)
  @Post('admin/reasons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  addReason(
    @Body() body: { type: string; reason: string; default_score: number },
  ) {
    return this.meritLogsService.addReason(
      body.type,
      body.reason,
      body.default_score,
    );
  }

  // 사유 삭제 (관리자)
  @Delete('admin/reasons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteReason(@Param('id') id: string) {
    return this.meritLogsService.deleteReason(+id);
  }

  // 상벌점 부여 (관리자) - 사유 포함
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateMeritLogDto) {
    return this.meritLogsService.create(dto);
  }

  // 상벌점 초기값 설정 (관리자) - 점수만
  @Patch('admin/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  setScore(@Param('userId') userId: string, @Body() dto: SetMeritScoreDto) {
    return this.meritLogsService.setScore(+userId, dto);
  }

  // 내 상벌점 내역 조회 (사용자)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyLogs(@GetUser() user) {
    return this.meritLogsService.getMyLogs(user.id);
  }

  // 내 누적 상벌점 조회 (사용자)
  @Get('me/summary')
  @UseGuards(JwtAuthGuard)
  getMySummary(@GetUser() user) {
    return this.meritLogsService.getMySummary(user.id);
  }
}
