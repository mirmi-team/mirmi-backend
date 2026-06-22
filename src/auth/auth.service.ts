import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from './entities/email-verification.entity';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
    private mailService: MailService,
  ) {}

  async sendVerificationCode(email: string) {
    // 6자리 랜덤 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 만료 시각 = 지금 + 5분
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 기존 미인증 레코드 있으면 지우고 새로 (간단하게)
    await this.emailVerificationRepository.delete({ email });

    // 저장
    const verification = this.emailVerificationRepository.create({
      email,
      verification_code: code,
      expires_at: expiresAt,
    });
    await this.emailVerificationRepository.save(verification);

    // 메일 발송
    await this.mailService.sendVerificationCode(email, code);

    return { message: '인증번호가 발송되었습니다.' };
  }

  // 인증번호 확인
  async verifyCode(email: string, code: string) {
    const verification = await this.emailVerificationRepository.findOne({
      where: { email },
    });

    if (!verification) {
      throw new BadRequestException('인증 요청을 먼저 해주세요.');
    }
    if (verification.expires_at < new Date()) {
      throw new BadRequestException('인증번호가 만료되었습니다.');
    }
    if (verification.verification_code.trim() !== code.trim()) {
      throw new BadRequestException('인증번호가 일치하지 않습니다.');
    }

    // 인증 완료 처리
    verification.is_verified = true;
    verification.verified_at = new Date();
    await this.emailVerificationRepository.save(verification);

    return { message: '이메일 인증이 완료되었습니다.' };
  }

  // 이메일 인증
  async register(dto: RegisterDto) {
    const verification = await this.emailVerificationRepository.findOne({
      where: { email: dto.email },
    });
    if (!verification || !verification.is_verified) {
      throw new BadRequestException('이메일 인증을 먼저 완료해주세요.');
    }

    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const room = await this.roomRepository.findOne({
      where: { room_number: dto.room_number },
    });
    if (!room) {
      throw new NotFoundException('존재하지 않는 방 번호입니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      username: dto.username,
      room_id: room.id,
      password: hashedPassword,
      can_staying: dto.can_staying,
      grade: dto.grade,
      class_no: dto.class_no,
    });
    const saved = await this.userRepository.save(user);

    const { password, ...result } = saved;
    return result;
  }
}
