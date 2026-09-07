import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

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
      html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 8px;">Mirmi</h1>
        <p style="color: #666; margin-bottom: 32px;">이메일 인증번호를 확인해주세요.</p>

        <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #999; margin: 0 0 12px;">인증번호</p>
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; margin: 0;">${code}</p>
        </div>

        <p style="font-size: 13px; color: #999; text-align: center;">인증번호는 <b>5분</b> 안에 입력해주세요.</p>
        <p style="font-size: 12px; color: #bbb; text-align: center; margin-top: 32px;">본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>
      </div>
    `,
    });
  }
}
