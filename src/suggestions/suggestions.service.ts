import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { ReplySuggestionDto } from './dto/reply-suggestion.dto';
import { UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Suggestion)
    private suggestionRepository: Repository<Suggestion>,
  ) {}

  // 건의사항 등록
  async create(userId: number, dto: CreateSuggestionDto) {
    const suggestion = this.suggestionRepository.create({
      created_by: userId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
    });
    const saved = await this.suggestionRepository.save(suggestion);

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      category: saved.category,
      created_at: saved.created_at,
    };
  }

  // 전체 목록 조회 (학생은 본인 것만, 관리자는 전체)
  async findAll(userId: number, role: UserRole) {
    const suggestions = await this.suggestionRepository.find({
      where: role === UserRole.ADMIN ? {} : { created_by: userId },
      order: { created_at: 'DESC' },
    });

    return suggestions.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      created_at: s.created_at,
      reply: s.reply,
    }));
  }

  // 상세 조회 (학생은 본인 것만, 관리자는 전체)
  async findOne(userId: number, role: UserRole, id: number) {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('건의사항을 찾을 수 없습니다.');
    }

    if (role !== UserRole.ADMIN && suggestion.created_by !== userId) {
      throw new ForbiddenException('본인 또는 관리자만 조회할 수 있습니다.');
    }

    return {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      created_at: suggestion.created_at,
      reply: suggestion.reply,
    };
  }

  // 답변 등록/수정 (관리자)
  async reply(id: number, dto: ReplySuggestionDto) {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('건의사항을 찾을 수 없습니다.');
    }

    suggestion.reply = dto.reply;
    await this.suggestionRepository.save(suggestion);

    return { id: suggestion.id, reply: suggestion.reply };
  }

  // 삭제 (본인 or 관리자)
  async remove(userId: number, role: UserRole, id: number) {
    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('건의사항을 찾을 수 없습니다.');
    }

    if (role !== UserRole.ADMIN && suggestion.created_by !== userId) {
      throw new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.');
    }

    await this.suggestionRepository.delete(id);
    return { message: '삭제되었습니다.' };
  }
}
