import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { VerifyReturnDto } from './dto/verify-return.dto';
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
  @ApiOperation({ summary: '오늘 복귀 시간 등록/수정' })
  @ApiResponse({ status: 201, description: '등록/수정 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  upsert(
    @Body() dto: CreateReturnRequestDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.returnRequestsService.upsert(dto, user.id);
  }

  // POST /returns/verify
  @ApiOperation({ summary: 'QR코드 스캔으로 실제 복귀 확인' })
  @ApiResponse({ status: 201, description: '복귀 확인 성공' })
  @ApiResponse({
    status: 400,
    description: '유효하지 않거나 만료된 QR, 또는 사전 등록 없음',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('verify')
  verify(@Body() dto: VerifyReturnDto, @CurrentUser() user: { id: number }) {
    return this.returnRequestsService.verify(dto, user.id);
  }
}
