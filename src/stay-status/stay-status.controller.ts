// src/stay-status/stay-status.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StayStatusService } from './stay-status.service';
import { CreateStayStatusDto } from './dto/create-stay-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('stay-status')
@ApiBearerAuth()
@Controller('stay-status')
export class StayStatusController {
  constructor(private readonly stayStatusService: StayStatusService) {}

  // 이번 주 잔류/외출 신청
  @ApiOperation({ summary: '이번 주 잔류/외출 신청' })
  @ApiResponse({ status: 201, description: '신청 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateStayStatusDto, @GetUser() user) {
    return this.stayStatusService.create(dto, user.id);
  }

  // 내 신청 내역 전체 조회
  @ApiOperation({ summary: '내 신청 내역 전체 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@GetUser() user) {
    return this.stayStatusService.findMine(user.id);
  }

  // 관리자 - 주간 전체 학생 현황 조회
  @ApiOperation({ summary: '주간 전체 학생 잔류/외출 현황 조회 (관리자) 해당 주의 월요일 날짜 입력' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findByWeekForAdmin(@Query('week') week: string) {
    return this.stayStatusService.findByWeekForAdmin(week);
  }
}
