// src/stay-status/dto/create-stay-status.dto.ts
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StayStatusType } from '../entities/stay-status.entity';

export class CreateStayStatusDto {
  @ApiProperty({ example: 'STAY', enum: StayStatusType })
  @IsEnum(StayStatusType)
  status: StayStatusType;
}
