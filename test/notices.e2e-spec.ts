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
import { Notice } from '../src/notices/entities/notice.entity';

describe('Notices (e2e)', () => {
  let app: INestApplication<App>;
  let noticeRepository: Repository<Notice>;

  let studentToken: string;
  let adminToken: string;
  let createdNoticeId: number;

  beforeAll(async () => {
    app = await createTestApp();
    noticeRepository = app.get(getRepositoryToken(Notice));

    studentToken = (
      await login(app, STUDENT_ACCOUNT.email, STUDENT_ACCOUNT.password)
    ).accessToken;
    adminToken = (
      await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    ).accessToken;
  });

  afterAll(async () => {
    if (createdNoticeId) {
      await noticeRepository.delete(createdNoticeId);
    }
    await app.close();
  });

  describe('POST /notices', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/notices')
        .send({ title: 't', description: 'd' });
      expect(res.status).toBe(401);
    });

    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/notices')
        .set(authHeader(studentToken))
        .send({ title: 't', description: 'd' });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 공지사항을 생성한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/notices')
        .set(authHeader(adminToken))
        .send({ title: 'E2E 테스트 공지', description: 'E2E 테스트 내용' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'E2E 테스트 공지',
        description: 'E2E 테스트 내용',
      });
      createdNoticeId = res.body.id;
    });
  });

  describe('GET /notices/findOne', () => {
    it('오늘 등록된 공지사항 중 최신 1개를 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/notices/findOne');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: createdNoticeId });
    });
  });

  describe('GET /notices/findAll', () => {
    it('오늘 등록된 공지사항 목록을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/notices/findAll');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        res.body.some((n: { id: number }) => n.id === createdNoticeId),
      ).toBe(true);
    });
  });

  describe('PATCH /notices/:id', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notices/${createdNoticeId}`)
        .set(authHeader(studentToken))
        .send({ title: '수정 시도' });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 공지사항을 수정한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notices/${createdNoticeId}`)
        .set(authHeader(adminToken))
        .send({ title: 'E2E 테스트 공지 (수정됨)' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: '공지사항이 수정되었습니다.' });

      const updated = await noticeRepository.findOne({
        where: { id: createdNoticeId },
      });
      expect(updated?.title).toBe('E2E 테스트 공지 (수정됨)');
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch('/notices/999999999')
        .set(authHeader(adminToken))
        .send({ title: 'x' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /notices/:id', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/notices/${createdNoticeId}`)
        .set(authHeader(studentToken));
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 공지사항을 삭제한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/notices/${createdNoticeId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: '공지사항이 삭제되었습니다.' });
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/notices/${createdNoticeId}`)
        .set(authHeader(adminToken));
      expect(res.status).toBe(404);
    });
  });
});
