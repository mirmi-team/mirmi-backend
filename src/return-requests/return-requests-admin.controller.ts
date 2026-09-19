import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReturnRequestsService } from './return-requests.service';
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

  // GET /admin/returns/qr
  @ApiOperation({
    summary: '복귀 확인용 QR코드 조회/발급 (관리자 전용, 5분마다 자동 갱신)',
    description:
      '호출 시점에 현재 QR 토큰이 유효하면 그대로 반환하고, 5분이 지나 만료됐으면 새로 발급합니다. 사감 화면에서 이 API를 주기적으로 다시 호출하면 자연스럽게 5분마다 새 QR로 바뀝니다.',
  })
  @ApiResponse({ status: 200, description: '조회/발급 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @Roles(UserRole.ADMIN)
  @Get('qr')
  getQr() {
    return this.returnRequestsService.getOrRefreshQr();
  }
}
