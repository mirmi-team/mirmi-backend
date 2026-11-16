import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoomWithStudentsResponseDto } from './dto/room-with-students-response.dto';
import { FindRoomsAdminQueryDto } from './dto/find-rooms-admin-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  // 'admin'이 :id로 해석되지 않도록 반드시 GET :id보다 위에 선언한다.
  @Get('admin')
  @ApiTags('rooms')
  @ApiBearerAuth()
  @ApiOperation({ summary: '호실별 학생 목록 조회 (관리자)' })
  @ApiQuery({
    name: 'floor',
    required: false,
    type: Number,
    description: '층 필터. 생략하면 전체 층',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: '호실 오름차순 목록. 학생이 없는 호실은 students: []',
    type: [RoomWithStudentsResponseDto],
  })
  @ApiResponse({ status: 400, description: 'floor가 정수가 아님' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: '관리자가 아님' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllWithStudents(@Query() query: FindRoomsAdminQueryDto) {
    return this.roomsService.findAllWithStudents(query.floor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
