import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import {
  ADMIN_ACCOUNT,
  STUDENT_ACCOUNT,
  authHeader,
  createTestApp,
  login,
} from './utils/e2e-setup';
import { User } from '../src/users/entities/user.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { EmailVerification } from '../src/auth/entities/email-verification.entity';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let roomRepository: Repository<Room>;
  let emailVerificationRepository: Repository<EmailVerification>;
  let refreshTokenRepository: Repository<RefreshToken>;

  let studentRefreshToken: string;

  const suffix = ((Math.floor(Date.now() / 1000) % 90) + 10).toString();
  const newUserEmail = `s26${suffix}@e-mirim.hs.kr`;
  let createdUserId: number | undefined;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get(getRepositoryToken(User));
    roomRepository = app.get(getRepositoryToken(Room));
    emailVerificationRepository = app.get(
      getRepositoryToken(EmailVerification),
    );
    refreshTokenRepository = app.get(getRepositoryToken(RefreshToken));

    const studentLogin = await login(
      app,
      STUDENT_ACCOUNT.email,
      STUDENT_ACCOUNT.password,
    );
    studentRefreshToken = studentLogin.refreshToken;
  });

  afterAll(async () => {
    if (createdUserId) {
      await userRepository.delete(createdUserId);
    }
    await emailVerificationRepository.delete({ email: newUserEmail });
    await app.close();
  });

  describe('POST /auth/email/send', () => {
    it('올바르지 않은 이메일 형식이면 400을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/send')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('이미 가입된 학생 이메일이면 409를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/send')
        .send({ email: STUDENT_ACCOUNT.email });

      expect(res.status).toBe(409);
    });

    it('신규 이메일이면 인증번호를 발송한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/send')
        .send({ email: newUserEmail });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: '인증번호가 발송되었습니다.' });
    });
  });

  describe('POST /auth/email/verify', () => {
    it('인증번호가 틀리면 400을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ email: newUserEmail, code: '000000' });

      expect(res.status).toBe(400);
    });

    it('올바른 인증번호면 인증을 완료한다', async () => {
      const verification = await emailVerificationRepository.findOne({
        where: { email: newUserEmail },
      });
      expect(verification).not.toBeNull();

      const res = await request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ email: newUserEmail, code: verification!.verification_code });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: '이메일 인증이 완료되었습니다.' });
    });
  });

  describe('POST /auth/signup', () => {
    it('이메일 인증 없이는 회원가입에 실패한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'unverified-e2e-test@example.com',
          password: 'password123',
          username: 'e2e-unverified',
          can_staying: true,
          room_number: 101,
          grade: 1,
          class_no: 1,
          gender: 'MALE',
        });

      expect(res.status).toBe(400);
    });

    it('이메일 인증을 완료했으면 회원가입에 성공한다', async () => {
      const [room] = await roomRepository.find({ take: 1 });
      expect(room).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: newUserEmail,
          password: 'password123',
          username: 'e2e-test-user',
          can_staying: true,
          room_number: room.room_number,
          grade: 1,
          class_no: 1,
          gender: 'MALE',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        email: newUserEmail,
        username: 'e2e-test-user',
      });
      expect(res.body.password).toBeUndefined();
      createdUserId = res.body.id;
    });

    it('이미 가입된 이메일이면 409를 반환한다', async () => {
      const [room] = await roomRepository.find({ take: 1 });

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: STUDENT_ACCOUNT.email,
          password: 'password123',
          username: 'dup-user',
          can_staying: true,
          room_number: room.room_number,
          grade: 1,
          class_no: 1,
          gender: 'MALE',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('올바른 계정이면 토큰을 발급한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(STUDENT_ACCOUNT);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toMatchObject({ email: STUDENT_ACCOUNT.email });
    });

    it('비밀번호가 틀리면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: STUDENT_ACCOUNT.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('존재하지 않는 이메일이면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'no-such-user@e-mirim.hs.kr',
          password: STUDENT_ACCOUNT.password,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('유효한 refreshToken이면 새 토큰 쌍을 발급한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: studentRefreshToken });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      studentRefreshToken = res.body.refreshToken;
    });

    it('유효하지 않은 refreshToken이면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).post('/auth/logout');
      expect(res.status).toBe(401);
    });

    it('로그아웃하면 refreshToken이 DB에서 제거된다', async () => {
      const adminLogin = await login(
        app,
        ADMIN_ACCOUNT.email,
        ADMIN_ACCOUNT.password,
      );

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set(authHeader(adminLogin.accessToken));

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: '로그아웃 되었습니다.' });

      const stored = await refreshTokenRepository.findOne({
        where: { user_id: adminLogin.userId },
      });
      expect(stored).toBeNull();
    });
  });
});
