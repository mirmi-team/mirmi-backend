// src/merit-logs/dto/set-merit-score.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetMeritScoreDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  score: number;
}
