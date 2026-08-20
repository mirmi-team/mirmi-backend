import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: '12345678!' })
  @IsString()
  oldPassword: string; // 현재 비밀번호 (본인 확인용)

  @ApiProperty({ example: 'newPassword123!' })
  @IsString()
  @MinLength(8)
  newPassword: string; // 새 비밀번호
}
