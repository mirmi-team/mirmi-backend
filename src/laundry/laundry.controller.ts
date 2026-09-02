import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LaundryService } from './laundry.service';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Laundry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laundry')
export class LaundryController {
  constructor(private readonly laundryService: LaundryService) {}

  // GET /laundry           -> 로그인 유저가 생활 중인 층의 세탁기 목록
  // GET /laundry?floor=5   -> 지정한 층의 세탁기 목록
  @ApiOperation({
    summary: '세탁기 목록 조회 (내 층 또는 지정한 층)',
    description:
      'floor 쿼리 파라미터를 안 주면 로그인한 유저가 생활 중인 층(방 정보 기준)의 세탁기만 반환합니다.',
  })
  @ApiQuery({
    name: 'floor',
    required: false,
    type: Number,
    description: '조회할 층. 생략하면 로그인 유저의 층으로 자동 조회됩니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAllMachines(
    @Query('floor') floorQuery: string | undefined,
    @CurrentUser() user: { id: number },
  ) {
    const floor = floorQuery
      ? parseInt(floorQuery, 10)
      : await this.laundryService.getUserFloor(user.id);

    return this.laundryService.findAllMachines(floor);
  }

  // GET /laundry/schedule?date=2026-08-31&floor=5
  @ApiOperation({
    summary:
      '층별 세탁기 사용 시간표 조회 (종이표와 동일한 요일별 고정 시간표)',
    description:
      'date로 넘긴 날짜의 요일에 해당하는 시간표를 반환합니다. 고정 배정(FIXED), 이미 예약된 오픈 슬롯(RESERVED), 아직 비어있는 오픈 슬롯(OPEN)으로 구분됩니다. floor를 안 주면 로그인 유저의 층으로 자동 조회됩니다.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({ name: 'floor', required: false, type: Number })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('schedule')
  async getSchedule(
    @Query('date') date: string,
    @Query('floor') floorQuery: string | undefined,
    @CurrentUser() user: { id: number },
  ) {
    const floor = floorQuery
      ? parseInt(floorQuery, 10)
      : await this.laundryService.getUserFloor(user.id);

    return this.laundryService.getSchedule(floor, date);
  }

  // POST /laundry/requests
  @ApiOperation({
    summary: '세탁 예약 신청 (사용 시간표에 있는 오픈 슬롯만 가능)',
  })
  @ApiResponse({ status: 201, description: '신청 성공' })
  @ApiResponse({ status: 400, description: '시간표에 없는 시간대' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '다른 호실에 고정 배정된 시간대' })
  @ApiResponse({ status: 404, description: '해당 세탁기를 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description:
      '종료 시간이 시작 시간보다 이르거나, 해당 시간에 이미 예약이 존재함',
  })
  @Post('requests')
  createReservation(
    @Body() dto: CreateLaundryDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.laundryService.createReservation(dto, user.id);
  }

  // GET /laundry/requests/me
  @ApiOperation({ summary: '내 세탁 예약 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('requests/me')
  findMyReservations(@CurrentUser() user: { id: number }) {
    return this.laundryService.findMyReservations(user.id);
  }

  // DELETE /laundry/reservations/:id
  @ApiOperation({ summary: '세탁 예약 취소 (본인 예약만 가능)' })
  @ApiParam({ name: 'id', description: '취소할 예약 id', example: 1 })
  @ApiResponse({ status: 200, description: '취소 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '본인의 신청만 취소할 수 있음' })
  @ApiResponse({ status: 404, description: '해당 세탁 신청을 찾을 수 없음' })
  @Delete('reservations/:id')
  cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.laundryService.cancelReservation(id, user.id);
  }
}
