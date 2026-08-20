import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { ReplySuggestionDto } from './dto/reply-suggestion.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UserRole } from 'src/users/entities/user.entity';

interface AuthUser {
  id: number;
  role: UserRole;
}

@ApiTags('suggestions')
@ApiBearerAuth()
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  // 건의사항 등록 - 학생
  @ApiOperation({ summary: '건의사항 등록' })
  @ApiResponse({ status: 201, description: '건의사항 등록 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateSuggestionDto) {
    return this.suggestionsService.create(user.id, dto);
  }

  // 전체 목록 조회 - 학생은 본인 것만, 관리자는 전체
  @ApiOperation({ summary: '건의사항 목록 조회 (학생: 본인 것, 관리자: 전체)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: AuthUser) {
    return this.suggestionsService.findAll(user.id, user.role);
  }

  // 상세 조회 - 학생은 본인 것만, 관리자는 전체
  @ApiOperation({ summary: '건의사항 상세 조회 (학생: 본인 것, 관리자: 전체)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.suggestionsService.findOne(user.id, user.role, +id);
  }

  // 답변 등록/수정 - 관리자
  @ApiOperation({ summary: '건의사항 답변 등록/수정 (관리자)' })
  @ApiResponse({ status: 200, description: '답변 등록/수정 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Patch('admin/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reply(@Param('id') id: string, @Body() dto: ReplySuggestionDto) {
    return this.suggestionsService.reply(+id, dto);
  }

  // 삭제 - 본인 or 관리자
  @ApiOperation({ summary: '건의사항 삭제 (본인 또는 관리자)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.suggestionsService.remove(user.id, user.role, +id);
  }
}
