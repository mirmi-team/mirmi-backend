import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReturnType {
  IMMEDIATE = 'IMMEDIATE',
  DINNER = 'DINNER',
  EIGHT_PM = 'EIGHT_PM',
}

export class CreateReturnRequestDto {
  @ApiProperty({
    description: '복귀 시간대 선택',
    enum: ReturnType,
    example: ReturnType.DINNER,
  })
  @IsEnum(ReturnType)
  return_type: ReturnType;

  @ApiPropertyOptional({
    description: '사유 (예: 즉시/저녁식사 후/오후 8시가 아닌 경우 등)',
    example: '병원 진료',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
