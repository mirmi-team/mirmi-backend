import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  // GET /returns
  @ApiOperation({ summary: '내 오늘 복귀 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공 (등록 전이면 null)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findMine(@CurrentUser() user: { id: number }) {
    return this.returnRequestsService.findMine(user.id);
  }

  // POST /returns
  @ApiOperation({
    summary: '오늘 복귀 예정 시간 사전 등록/수정',
    description:
      '참고용 사전 신청입니다. 실제 return_type은 QR 체크인 시각을 기준으로 서버가 자동으로 다시 결정합니다.',
  })
  @ApiResponse({ status: 201, description: '등록/수정 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  upsert(
    @Body() dto: CreateReturnRequestDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.returnRequestsService.upsert(dto, user.id);
  }

  // GET /returns/qr
  @ApiOperation({
    summary: '내 복귀 인증용 QR 발급 (30초 후 만료)',
    description:
      '학생 본인 화면에 QR을 띄워두면, 사감이 그 QR을 스캔해서 복귀를 확인합니다. 30초마다 화면을 새로고침해서 새 QR을 다시 받아야 합니다.',
  })
  @ApiResponse({ status: 200, description: '발급 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('qr')
  getMyQr(@CurrentUser() user: { id: number }) {
    return this.returnRequestsService.generateMyQr(user.id);
  }
}
