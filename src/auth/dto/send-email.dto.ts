import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 's2546@e-mirim.hs.kr' })
  @IsEmail()
  // @Matches(/@e-mirim\.hs\.kr$/, {
  //   message: '학교 이메일로만 가입할 수 있습니다.',
  // })
  email: string;
}
