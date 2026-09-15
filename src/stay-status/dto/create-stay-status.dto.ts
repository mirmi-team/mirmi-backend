// src/stay-status/dto/create-stay-status.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StayStatusType } from '../entities/stay-status.entity';

export class CreateStayStatusDto {
  @ApiProperty({ example: 'STAY', enum: StayStatusType })
  @IsEnum(StayStatusType)
  status: StayStatusType;

  @ApiProperty({ example: '010-1234-5678', required: false })
  @IsOptional()
  @IsString()
  parent_phone?: string;
}
