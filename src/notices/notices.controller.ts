import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { GetAdminNoticesDto } from './dto/get-admin-notices.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('notices')
@ApiBearerAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // 오늘 공지사항 조회 - 누구나 가능
  @ApiOperation({ summary: '오늘 공지사항 최근 1개 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @Get('findOne')
  findOne() {
    return this.noticesService.findOne();
  }

  @ApiOperation({ summary: '오늘 공지사항 전체 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @Get('findAll')
  findAll() {
    return this.noticesService.findAll();
  }

  // 관리자 공지사항 목록 - 전체 기간, 페이지네이션 (':id' 라우트와 겹치지 않도록 고정 경로로 둔다)
  @ApiOperation({ summary: '공지사항 전체 기간 목록 조회 (관리자)' })
  @ApiResponse({
    status: 200,
    description: '조회 성공 ({ items, total, page, limit })',
  })
  @ApiResponse({ status: 400, description: '잘못된 page/limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  findAllForAdmin(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetAdminNoticesDto,
  ) {
    return this.noticesService.findAllForAdmin(query.page, query.limit);
  }

  //등록 - 관리자만
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description'],
      properties: {
        title: { type: 'string', example: '오늘 저녁 점호 공지' },
        description: {
          type: 'string',
          example: '오늘 저녁 점호는 21시 30분에 각 층 라운지에서 진행됩니다.',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: '공지 이미지 파일',
        },
      },
    },
  })
  @ApiOperation({ summary: '공지사항 등록 (관리자)' })
  @ApiResponse({ status: 201, description: '공지사항 등록 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  async create(@Body() dto: CreateNoticeDto,
  @UploadedFile() file?: Express.Multer.File,
) {
    return this.noticesService.create(dto, file);
  }

  //수정 - 관리자만
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: '오늘 저녁 점호 공지' },
        description: {
          type: 'string',
          example: '오늘 저녁 점호는 21시 30분에 각 층 라운지에서 진행됩니다.',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: '공지 이미지 파일',
        },
      },
    },
  })
  @ApiOperation({ summary: '공지사항 수정 (관리자)' })
  @ApiResponse({ status: 200, description: '공지사항 수정 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateNoticeDto, @UploadedFile() file?: Express.Multer.File) {
    return this.noticesService.update(+id, dto, file);
  }

  //삭제 - 관리자만
  @ApiOperation({ summary: '공지사항 삭제 (관리자)' })
  @ApiResponse({ status: 200, description: '공지사항 삭제 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // 토큰 검증 -> 권한 검증
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.noticesService.delete(+id);
  }

}
