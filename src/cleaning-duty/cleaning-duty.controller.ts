import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CleaningDutyService } from './cleaning-duty.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('CleaningDuty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cleanings')
export class CleaningDutyController {
  constructor(private readonly cleaningDutyService: CleaningDutyService) {}

  // GET /cleanings?duty_date=2026-05-14
  @ApiOperation({ summary: '아침 청소 당번 조회 (날짜별)' })
  @ApiQuery({
    name: 'duty_date',
    required: true,
    type: String,
    description: '조회할 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(@Query('duty_date') dutyDate: string) {
    return this.cleaningDutyService.findAll(dutyDate);
  }
}
