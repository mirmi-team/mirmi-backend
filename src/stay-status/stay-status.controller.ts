// src/stay-status/stay-status.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
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
  @ApiOperation({
    summary:
      '주간 전체 학생 잔류/외출 현황 조회 (관리자) 해당 주의 월요일 날짜 입력',
    description:
      'list 에 학생별로 이름·호실·상태·부모님 연락처(parent_phone)가 담깁니다. ' +
      '해당 주에 아직 신청하지 않은 잔류 신청 대상 학생(STUDENT, can_staying=true)도 ' +
      'list 뒤쪽(방 번호순)에 포함되며, 이 경우 id·status·parent_phone·updated_at 은 null 입니다. ' +
      '방이 배정되지 않은 학생은 room_number 가 null 입니다. ' +
      'can_staying=false 학생과 ADMIN 은 제외됩니다.',
  })
  @ApiQuery({
    name: 'week',
    description: '해당 주 월요일 날짜 (YYYY-MM-DD)',
    example: '2026-05-11',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    schema: {
      example: {
        week_start: '2026-05-11',
        summary: { STAY: 1, OUTING: 1, NOT_SUBMITTED: 1 },
        list: [
          {
            id: 1,
            user_id: 10,
            username: '홍길동',
            room_number: 201,
            status: 'STAY',
            parent_phone: '010-1234-5678',
            week_start: '2026-05-11',
            updated_at: '2026-05-11T09:00:00.000Z',
          },
          {
            id: null,
            user_id: 11,
            username: '김미림',
            room_number: 305,
            status: null,
            parent_phone: null,
            week_start: '2026-05-11',
            updated_at: null,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findByWeekForAdmin(@Query('week') week: string) {
    return this.stayStatusService.findByWeekForAdmin(week);
  }
}
