import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SuggestionCategory } from '../entities/suggestion.entity';

export class CreateSuggestionDto {
  @ApiProperty({ example: '샤워실 온수가 자주 끊깁니다' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: '저녁 8시 이후 3층 샤워실 온수가 자주 끊겨서 불편합니다. 점검 부탁드립니다.' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ example: 'FACILITY', enum: SuggestionCategory })
  @IsEnum(SuggestionCategory)
  category: SuggestionCategory;
}
