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

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  // 건의사항 등록 - 학생
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: AuthUser, @Body() dto: CreateSuggestionDto) {
    return this.suggestionsService.create(user.id, dto);
  }

  // 전체 목록 조회 - 학생은 본인 것만, 관리자는 전체
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: AuthUser) {
    return this.suggestionsService.findAll(user.id, user.role);
  }

  // 상세 조회 - 학생은 본인 것만, 관리자는 전체
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.suggestionsService.findOne(user.id, user.role, +id);
  }

  // 답변 등록/수정 - 관리자
  @Patch('admin/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reply(@Param('id') id: string, @Body() dto: ReplySuggestionDto) {
    return this.suggestionsService.reply(+id, dto);
  }

  // 삭제 - 본인 or 관리자
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    return this.suggestionsService.remove(user.id, user.role, +id);
  }
}
