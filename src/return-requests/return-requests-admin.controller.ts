import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ReturnRequestsService } from './return-requests.service';
import { VerifyReturnDto } from './dto/verify-return.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('ReturnsAdmin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/returns')
export class ReturnRequestsAdminController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  // POST /admin/returns/verify
  @ApiOperation({
    summary: '학생 QR 스캔으로 복귀 확인 (사감 전용)',
    description:
      '학생 화면에 뜬 QR을 스캔한 값을 그대로 넘기면 됩니다. 지금 시각을 기준으로 복귀 타입(바로복귀/석식복귀/8시복귀)이 자동으로 결정되어 저장됩니다. 해당 시간대가 아니면 타입 없이 저장됩니다.',
  })
  @ApiResponse({ status: 201, description: '복귀 확인 성공' })
  @ApiResponse({
    status: 400,
    description: '유효하지 않거나 만료(30초 경과)된 QR',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @Roles(UserRole.ADMIN)
  @Post('verify')
  verify(@Body() dto: VerifyReturnDto) {
    return this.returnRequestsService.verifyByAdmin(dto);
  }

  // GET /admin/returns/today?floor=5
  @ApiOperation({
    summary: '오늘 전체 학생 복귀 현황 조회 (층별, 사감 전용)',
    description:
      'floor를 주면 그 층 학생만, 안 주면 전체 층을 층별로 묶어서 반환합니다. 학생마다 checkins 에 바로복귀/석식복귀/8시복귀를 각각 언제 찍었는지(안 찍었으면 null) 담아 주고, 한 번이라도 찍었으면 status 가 복귀완료입니다.',
  })
  @ApiQuery({
    name: 'floor',
    required: false,
    type: Number,
    description: '조회할 층. 생략하면 전체 층.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @Roles(UserRole.ADMIN)
  @Get('today')
  getTodayStatus(@Query('floor') floorQuery: string | undefined) {
    const floor = floorQuery ? parseInt(floorQuery, 10) : undefined;
    return this.returnRequestsService.getTodayStatusByFloor(floor);
  }
}
