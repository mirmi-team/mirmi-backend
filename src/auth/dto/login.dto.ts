import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 's2546@e-mirim.hs.kr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678!' })
  @IsString()
  password: string;
}
