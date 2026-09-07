// src/merit-logs/dto/create-merit-log.dto.ts
import { IsEnum, IsInt, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MeritType } from '../entities/merit-log.entity';

export class CreateMeritLogDto {
  @ApiProperty({ example: 17 })
  @IsInt()
  user_id: number;

  @ApiProperty({ example: 'PENALTY', enum: MeritType })
  @IsEnum(MeritType)
  type: MeritType;

  @ApiProperty({
    example: 3,
    description: '점수 크기(절댓값). 부호는 type에 따라 서버가 결정한다.',
  })
  @IsInt()
  score: number;

  @ApiProperty({ example: '점호 시간 미준수' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
