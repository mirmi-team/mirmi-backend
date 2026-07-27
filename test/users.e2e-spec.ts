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

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;

  let studentToken: string;
  let studentUserId: number;
  let adminToken: string;

  let originalProfileImage: string | null;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get(getRepositoryToken(User));

    const studentLogin = await login(
      app,
      STUDENT_ACCOUNT.email,
      STUDENT_ACCOUNT.password,
    );
    studentToken = studentLogin.accessToken;
    studentUserId = studentLogin.userId;

    const adminLogin = await login(
      app,
      ADMIN_ACCOUNT.email,
      ADMIN_ACCOUNT.password,
    );
    adminToken = adminLogin.accessToken;

    const student = await userRepository.findOne({
      where: { id: studentUserId },
    });
    originalProfileImage = student?.profile_image ?? null;
  });

  afterAll(async () => {
    await userRepository.update(
      studentUserId,
      { profile_image: originalProfileImage },
    );
    await app.close();
  });

  describe('GET /users/me', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
    });

    it('학생 토큰으로 본인 정보를 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: studentUserId,
        email: STUDENT_ACCOUNT.email,
      });
      expect(res.body.password).toBeUndefined();
      expect(res.body).toHaveProperty('room_number');
    });

    it('관리자 토큰으로 본인 정보를 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: ADMIN_ACCOUNT.email });
    });
  });

  describe('PATCH /users/me/password', () => {
    const tempPassword = 'temp-pw-1234!';

    it('현재 비밀번호가 틀리면 400을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(studentToken))
        .send({ oldPassword: 'wrong-password', newPassword: tempPassword });

      expect(res.status).toBe(400);
    });

    it('비밀번호를 변경한 뒤 원래 비밀번호로 되돌린다', async () => {
      const changeRes = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(studentToken))
        .send({
          oldPassword: STUDENT_ACCOUNT.password,
          newPassword: tempPassword,
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body).toEqual({ message: '비밀번호가 변경되었습니다.' });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: STUDENT_ACCOUNT.email, password: tempPassword });
      expect(loginRes.status).toBe(201);

      const revertRes = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(studentToken))
        .send({
          oldPassword: tempPassword,
          newPassword: STUDENT_ACCOUNT.password,
        });
      expect(revertRes.status).toBe(200);
      expect(revertRes.body).toEqual({ message: '비밀번호가 변경되었습니다.' });
    });
  });

  describe('PATCH /users/me/profile-image', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).patch(
        '/users/me/profile-image',
      );
      expect(res.status).toBe(401);
    });

    it('이미지 파일을 업로드하면 profile_image URL을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/profile-image')
        .set(authHeader(studentToken))
        .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
          filename: 'e2e-test.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: '프로필 사진이 변경되었습니다.',
        profile_image: expect.any(String),
      });
    });
  });
});
