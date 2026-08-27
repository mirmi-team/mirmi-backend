import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplySuggestionDto {
  @ApiProperty({ example: '확인 후 시설팀에 점검 요청 완료했습니다.' })
  @IsString()
  @MinLength(1)
  reply: string;
}
