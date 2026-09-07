import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('ScheduleAdmin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/schedules')
export class ScheduleAdminController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // POST /admin/schedules
  @ApiOperation({ summary: '기숙사 일정 등록 (관리자 전용)' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  // PATCH /admin/schedules/:id
  @ApiOperation({ summary: '기숙사 일정 수정 (관리자 전용)' })
  @ApiParam({ name: 'id', description: '수정할 일정 id', example: 1 })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @ApiResponse({ status: 404, description: '해당 일정을 찾을 수 없음' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(id, dto);
  }

  // DELETE /admin/schedules/:id
  @ApiOperation({ summary: '기숙사 일정 삭제 (관리자 전용)' })
  @ApiParam({ name: 'id', description: '삭제할 일정 id', example: 1 })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자만 접근할 수 있음' })
  @ApiResponse({ status: 404, description: '해당 일정을 찾을 수 없음' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.remove(id);
  }
}
