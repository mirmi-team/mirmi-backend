// src/merit-logs/dto/create-merit-log.dto.ts
import { IsEnum, IsInt, IsString, IsNotEmpty } from 'class-validator';
import { MeritType } from '../entities/merit-log.entity';

export class CreateMeritLogDto {
  @IsInt()
  user_id: number;

  @IsEnum(MeritType)
  type: MeritType;

  @IsInt()
  score: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
