import { IsString, MinLength } from 'class-validator';

export class ReplySuggestionDto {
  @IsString()
  @MinLength(1)
  reply: string;
}
