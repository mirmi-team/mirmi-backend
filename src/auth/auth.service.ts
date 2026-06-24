import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from './entities/email-verification.entity';
import { MailService } from './mail.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private mailService: MailService,
    private jwtService: JwtService,
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

  async login(email: string, password: string) {
    // 1. 이메일로 사용자 찾기
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // 3. 토큰 발급
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      // accessToken 발급
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h', // 1시간
    });

    const refreshToken = this.jwtService.sign(payload, {
      // refreshToken 발급
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '14d', // 2주
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // refreshToken DB에 넣을 만료 기간 설정 (현재날짜 + 14일)

    await this.refreshTokenRepository.delete({ user_id: user.id }); // user의 refresh_token DB 비우기

    const tokenEntity = this.refreshTokenRepository.create({
      // refresh_token DB에 정보 저장
      user_id: user.id,
      token_hash: hashedRefreshToken,
      expires_at: expiresAt,
    });

    await this.refreshTokenRepository.save(tokenEntity);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  // 새 accessToken 발급
  async refresh(refreshToken: string) {
    // 1. refreshToken 유효성 검사
    let payload: any;

    // 받은 refreshToken을 검증하면서 검증되면 정보는 payload에 저장되고 검증이 실패하면 exception 처리
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // 2. DB에 연결된 토큰과 대조
    const stored = await this.refreshTokenRepository.findOne({
      where: { user_id: payload.sub },
    });
    if (!stored) throw new UnauthorizedException('로그인이 필요합니다.');

    const isMatch = await bcrypt.compare(refreshToken, stored.token_hash);
    if (!isMatch) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // 3. 새 AccessToken 발급
    const newPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    const accessToken = this.jwtService.sign(newPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    });

    return { accessToken };
  }

  async logout(userId: number) {
    await this.refreshTokenRepository.delete({ user_id: userId });
    return { message: '로그아웃 되었습니다.' };
  }
}
