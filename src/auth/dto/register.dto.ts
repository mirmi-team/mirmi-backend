import { IsEmail, IsString, MinLength, IsInt } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  username: string;

  @IsInt()
  room_id: number;
}
