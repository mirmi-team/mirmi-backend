import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyReturnDto {
  @ApiProperty({
    description: '학생 화면에 뜬 QR을 스캔해서 읽은 토큰 값',
    example: '17.1758270000000.9f8e7d6c5b4a...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
