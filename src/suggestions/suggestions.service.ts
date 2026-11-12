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
import { User, UserRole } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { localDateTimeTransformer } from 'src/common/transformers/local-datetime.transformer';
import { SuggestionAuthorDto } from './dto/suggestion-response.dto';

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

  // 관리자용: users, rooms를 LEFT JOIN해서 한 번의 쿼리로 작성자 정보를 함께 가져온다.
  // (작성자가 없거나 users에 없으면 author는 null)
  private async findWithAuthor(id?: number) {
    const qb = this.suggestionRepository
      .createQueryBuilder('s')
      .leftJoin(User, 'u', 'u.id = s.created_by')
      .leftJoin(Room, 'r', 'r.id = u.room_id')
      .addSelect('u.id', 'author_id')
      .addSelect('u.username', 'author_username')
      .addSelect('r.room_number', 'author_room_number')
      .addSelect('u.grade', 'author_grade')
      .addSelect('u.class_no', 'author_class_no')
      .orderBy('s.created_at', 'DESC')
      .addOrderBy('s.id', 'DESC');
    if (id !== undefined) {
      qb.where('s.id = :id', { id });
    }

    const { entities, raw } = await qb.getRawAndEntities<{
      s_id: number;
      author_id: number | null;
      author_username: string | null;
      author_room_number: number | null;
      author_grade: number | null;
      author_class_no: number | null;
    }>();

    const authors = new Map<number, SuggestionAuthorDto | null>();
    for (const row of raw) {
      authors.set(
        row.s_id,
        row.author_id == null
          ? null
          : {
              username: row.author_username as string,
              room_number: row.author_room_number,
              grade: row.author_grade,
              class_no: row.author_class_no,
            },
      );
    }

    return entities.map((s) => ({
      suggestion: s,
      author: authors.get(s.id) ?? null,
    }));
  }

  // 전체 목록 조회 (학생은 본인 것만, 관리자는 전체 + 작성자 정보)
  async findAll(userId: number, role: UserRole) {
    if (role === UserRole.ADMIN) {
      const rows = await this.findWithAuthor();
      return rows.map(({ suggestion: s, author }) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        created_at: s.created_at,
        reply: s.reply,
        replied_at: s.replied_at,
        author,
      }));
    }

    const suggestions = await this.suggestionRepository.find({
      where: { created_by: userId },
      order: { created_at: 'DESC' },
    });

    return suggestions.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      created_at: s.created_at,
      reply: s.reply,
      replied_at: s.replied_at,
    }));
  }

  // 상세 조회 (학생은 본인 것만, 관리자는 전체 + 작성자 정보)
  async findOne(userId: number, role: UserRole, id: number) {
    if (role === UserRole.ADMIN) {
      const [row] = await this.findWithAuthor(id);
      if (!row) {
        throw new NotFoundException('건의사항을 찾을 수 없습니다.');
      }
      const { suggestion, author } = row;
      return {
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        created_at: suggestion.created_at,
        reply: suggestion.reply,
        replied_at: suggestion.replied_at,
        author,
      };
    }

    const suggestion = await this.suggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('건의사항을 찾을 수 없습니다.');
    }

    if (suggestion.created_by !== userId) {
      throw new ForbiddenException('본인 또는 관리자만 조회할 수 있습니다.');
    }

    return {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      created_at: suggestion.created_at,
      reply: suggestion.reply,
      replied_at: suggestion.replied_at,
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
    // created_at과 같은 서버 로컬 시각 기준 문자열로 기록한다
    suggestion.replied_at = localDateTimeTransformer.from(new Date()) as string;
    await this.suggestionRepository.save(suggestion);

    return {
      id: suggestion.id,
      reply: suggestion.reply,
      replied_at: suggestion.replied_at,
    };
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
