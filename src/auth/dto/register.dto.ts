import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  IsBoolean,
  Max,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 's2546@e-mirim.hs.kr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  username: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  can_staying: boolean;

  @ApiProperty({ example: 301 })
  @IsInt()
  room_number: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(3)
  grade: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(6)
  class_no: number;

  @ApiProperty({ example: 'MALE', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;
}
