import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendVerificationCode(to: string, code: string) {
    await this.transporter.sendMail({
      from: `"Mirmi" <${process.env.MAIL_USER}>`,
      to,
      subject: '[Mirmi] 이메일 인증번호',
      text: `인증번호는 ${code} 입니다. 5분 안에 입력해주세요.`,
    });
  }
}
