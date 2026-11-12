import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuggestionCategory } from '../entities/suggestion.entity';

export class SuggestionAuthorDto {
  @ApiProperty({ example: '홍길동' })
  username: string;

  @ApiProperty({ example: 301, nullable: true })
  room_number: number | null;

  @ApiProperty({ example: 2, nullable: true })
  grade: number | null;

  @ApiProperty({ example: 3, nullable: true })
  class_no: number | null;
}

export class SuggestionListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '세탁실 건조기 수리 요청' })
  title: string;

  @ApiProperty({ enum: SuggestionCategory })
  category: SuggestionCategory;

  @ApiProperty({ example: '2026-11-12T10:00:00+09:00' })
  created_at: Date;

  @ApiProperty({ example: '확인 후 수리하겠습니다.', nullable: true })
  reply: string | null;

  @ApiProperty({
    example: '2026-11-12T15:30:00',
    nullable: true,
    description: '답변 일시 (미답변이면 null)',
  })
  replied_at: string | null;

  @ApiPropertyOptional({
    type: SuggestionAuthorDto,
    nullable: true,
    description:
      '작성자 정보 (관리자 응답에만 포함, 작성자를 찾을 수 없으면 null)',
  })
  author?: SuggestionAuthorDto | null;
}

export class SuggestionDetailDto extends SuggestionListItemDto {
  @ApiProperty({ example: '건조기가 작동하지 않습니다.' })
  description: string;
}

export class SuggestionReplyResultDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '확인 후 수리하겠습니다.' })
  reply: string;

  @ApiProperty({ example: '2026-11-12T15:30:00' })
  replied_at: string;
}
