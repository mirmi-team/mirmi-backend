import { IsEmail, IsString, MinLength, IsInt, IsBoolean } from 'class-validator';

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
  grade: number;

  @IsInt()
  class_no: number;
}
