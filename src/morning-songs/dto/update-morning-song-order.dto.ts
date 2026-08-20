// src/morning-songs/dto/update-morning-song-order.dto.ts
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMorningSongOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  play_order: number;
}
