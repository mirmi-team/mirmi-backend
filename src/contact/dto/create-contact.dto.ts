import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: '앱 사용 중 오류가 발생했습니다' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiProperty({ example: '로그인 후 메인 화면에서 앱이 종료됩니다.' })
  @IsString()
  @MinLength(1)
  message: string;
}
