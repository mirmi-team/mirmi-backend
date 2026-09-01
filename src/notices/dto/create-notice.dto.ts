import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { isOptionalChain } from 'typescript';

export class CreateNoticeDto {
  @ApiProperty({ example: '오늘 저녁 점호 공지' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '오늘 저녁 점호는 21시 30분에 각 층 라운지에서 진행됩니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://....', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}
