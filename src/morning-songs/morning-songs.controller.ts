// src/morning-songs/morning-songs.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { MorningSongsService } from './morning-songs.service';
import { CreateMorningSongDto } from './dto/create-morning-song.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('morning-songs')
@ApiBearerAuth()
@Controller('morning-songs')
export class MorningSongsController {
  constructor(private readonly morningSongsService: MorningSongsService) {}

  // 유튜브 노래 검색
  @ApiOperation({ summary: '유튜브 노래 검색' })
  @ApiResponse({ status: 200, description: '검색 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') q: string) {
    return this.morningSongsService.search(q);
  }

  // 오늘 신청곡 조회 (KST 기준)
  @ApiOperation({ summary: '오늘 신청곡 조회 (KST 기준)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('today')
  @UseGuards(JwtAuthGuard)
  findToday() {
    return this.morningSongsService.findToday();
  }

  // 내 신청 내역 조회
  @ApiOperation({ summary: '내 신청 내역 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@GetUser() user) {
    return this.morningSongsService.findMine(user.id);
  }

  // 관리자 - 날짜별 신청 목록 조회
  @ApiOperation({ summary: '날짜별 신청 목록 조회 (관리자)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findByDateForAdmin(@Query('date') date: string) {
    return this.morningSongsService.findByDateForAdmin(date);
  }

  // 아침 노래 신청
  @ApiOperation({ summary: '아침 노래 신청' })
  @ApiResponse({ status: 201, description: '신청 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateMorningSongDto, @GetUser() user) {
    return this.morningSongsService.create(dto, user.id);
  }

  // 관리자 - 삭제
  @ApiOperation({ summary: '신청곡 삭제 (관리자)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  removeByAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.morningSongsService.removeByAdmin(id);
  }

  // 내 신청 삭제
  @ApiOperation({ summary: '내 신청곡 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user) {
    return this.morningSongsService.remove(id, user.id);
  }
}
