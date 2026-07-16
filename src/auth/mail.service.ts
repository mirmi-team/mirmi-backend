import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendVerificationCode(to: string, code: string) {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM!,
      subject: '[Mirmi] 이메일 인증번호',
      text: `인증번호는 ${code} 입니다. 5분 안에 입력해주세요.`,
    });
  }
}
