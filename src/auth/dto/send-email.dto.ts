import { IsEmail, Matches } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @Matches(/@e-mirim\.hs\.kr$/, { // 정규식
    message: '학교 이메일로만 가입할 수 있습니다.',
  })
  email: string;
}
