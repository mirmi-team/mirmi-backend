import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyReturnDto {
  @ApiProperty({
    description: 'QR코드에 담긴 토큰 값 (스캔해서 읽은 그대로)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
