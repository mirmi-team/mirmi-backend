import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';

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
}
