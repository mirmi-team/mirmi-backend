// E2E 테스트에서는 실제 Resend API를 호출하지 않도록 Mock 처리한다.
// (Resend 무료 한도 초과 및 실제 메일 발송 방지)
export const mockResendSend = jest
  .fn()
  .mockResolvedValue({ data: { id: 'mock-id' }, error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

export const STUDENT_ACCOUNT = {
  email: 's2546@e-mirim.hs.kr',
  password: '12345678!',
};

export const ADMIN_ACCOUNT = {
  email: 's2531@e-mirim.hs.kr',
  password: '12345678!',
};

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

export async function login(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    userId: res.body.user.id as number,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
