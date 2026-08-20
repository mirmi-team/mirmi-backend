// src/morning-songs/dto/create-morning-song.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMorningSongDto {
  @ApiProperty({ example: 'IVE - Rebel Heart' })
  @IsString()
  @IsNotEmpty()
  song_name: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=jeqdYqsrsA0' })
  @IsString()
  @IsNotEmpty()
  youtube_url: string;

  @ApiPropertyOptional({
    example: 'https://i.ytimg.com/vi/jeqdYqsrsA0/default.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  play_date: string;
}
