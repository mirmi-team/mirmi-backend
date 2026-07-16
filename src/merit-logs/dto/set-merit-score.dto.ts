// src/merit-logs/dto/set-merit-score.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';

export class SetMeritScoreDto {
  @IsInt()
  @IsNotEmpty()
  score: number;
}
