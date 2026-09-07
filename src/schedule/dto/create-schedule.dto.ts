import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({
    description: '일정 제목',
    example: '기숙사 점호 시간 변경',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '일정 설명',
    example: '시험 기간으로 인해 점호 시간이 23시로 변경됩니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
