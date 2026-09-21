import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
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
}
