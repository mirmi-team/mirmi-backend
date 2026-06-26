import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string; // 현재 비밀번호 (본인 확인용)

  @IsString()
  @MinLength(8)
  newPassword: string; // 새 비밀번호
}
