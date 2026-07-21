import { IsEnum, IsString, MinLength } from 'class-validator';
import { SuggestionCategory } from '../entities/suggestion.entity';

export class CreateSuggestionDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsEnum(SuggestionCategory)
  category: SuggestionCategory;
}
