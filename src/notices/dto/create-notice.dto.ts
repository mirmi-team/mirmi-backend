import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoticeDto {
  @ApiProperty({ example: '오늘 저녁 점호 공지' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '오늘 저녁 점호는 21시 30분에 각 층 라운지에서 진행됩니다.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
