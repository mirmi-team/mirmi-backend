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
import { Gender } from 'src/users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  username: string;

  @IsBoolean()
  can_staying: boolean;

  @IsInt()
  room_number: number;

  @IsInt()
  @Min(1)
  @Max(3)
  grade: number;

  @IsInt()
  @Min(1)
  @Max(6)
  class_no: number;

  @IsEnum(Gender)
  gender: Gender;
}
