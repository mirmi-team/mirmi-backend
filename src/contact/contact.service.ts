import { Injectable, InternalServerErrorException } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { CreateContactDto } from './dto/create-contact.dto';

interface ContactSender {
  username: string;
  email: string;
}

@Injectable()
export class ContactService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendContactMail(sender: ContactSender, dto: CreateContactDto) {
    try {
      await sgMail.send({
        to: 'mirmi.dev@gmail.com',
        from: process.env.SENDGRID_FROM!,
        subject: `[문의] ${dto.subject}`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 12px;">📬 새 문의가 도착했습니다</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background: #f9f9f9; font-weight: bold; width: 100px; border: 1px solid #eee;">보낸 사람</td>
              <td style="padding: 10px; border: 1px solid #eee;">${sender.username}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f9f9f9; font-weight: bold; border: 1px solid #eee;">이메일</td>
              <td style="padding: 10px; border: 1px solid #eee;">${sender.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f9f9f9; font-weight: bold; border: 1px solid #eee;">제목</td>
              <td style="padding: 10px; border: 1px solid #eee;">${dto.subject}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <p style="font-weight: bold; color: #333;">📝 문의 내용</p>
            <div style="background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 16px; line-height: 1.6;">
              ${dto.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <p style="margin-top: 24px; font-size: 12px; color: #999;">이 메일은 Mirmi 앱에서 자동 발송되었습니다.</p>
        </div>
      `,
      });
    } catch {
      throw new InternalServerErrorException('문의 메일 발송에 실패했습니다.');
    }
  }
}
