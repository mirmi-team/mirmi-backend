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
import { Suggestion } from '../src/suggestions/entities/suggestion.entity';

describe('Suggestions (e2e)', () => {
  let app: INestApplication<App>;
  let suggestionRepository: Repository<Suggestion>;

  let studentToken: string;
  let adminToken: string;
  let createdSuggestionId: number;

  beforeAll(async () => {
    app = await createTestApp();
    suggestionRepository = app.get(getRepositoryToken(Suggestion));

    studentToken = (
      await login(app, STUDENT_ACCOUNT.email, STUDENT_ACCOUNT.password)
    ).accessToken;
    adminToken = (
      await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    ).accessToken;
  });

  afterAll(async () => {
    if (createdSuggestionId) {
      await suggestionRepository.delete(createdSuggestionId);
    }
    await app.close();
  });

  describe('POST /suggestions', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/suggestions')
        .send({ title: 't', description: 'd', category: 'ETC' });
      expect(res.status).toBe(401);
    });

    it('잘못된 category면 400을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/suggestions')
        .set(authHeader(studentToken))
        .send({ title: 't', description: 'd', category: 'INVALID' });
      expect(res.status).toBe(400);
    });

    it('학생 토큰으로 건의사항을 등록한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/suggestions')
        .set(authHeader(studentToken))
        .send({
          title: 'E2E 테스트 건의',
          description: 'E2E 테스트 내용입니다.',
          category: 'FACILITY',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'E2E 테스트 건의',
        description: 'E2E 테스트 내용입니다.',
        category: 'FACILITY',
      });
      createdSuggestionId = res.body.id;
    });
  });

  describe('GET /suggestions', () => {
    it('학생은 본인이 작성한 건의사항 목록만 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/suggestions')
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(
        res.body.some((s: { id: number }) => s.id === createdSuggestionId),
      ).toBe(true);
    });

    it('관리자는 전체 건의사항 목록을 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/suggestions')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(
        res.body.some((s: { id: number }) => s.id === createdSuggestionId),
      ).toBe(true);
    });
  });

  describe('GET /suggestions/:id', () => {
    it('작성자 본인이 상세 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${createdSuggestionId}`)
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: createdSuggestionId,
        title: 'E2E 테스트 건의',
        reply: null,
      });
    });

    it('관리자도 상세 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${createdSuggestionId}`)
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/suggestions/999999999')
        .set(authHeader(studentToken));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /suggestions/admin/:id/reply', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/suggestions/admin/${createdSuggestionId}/reply`)
        .set(authHeader(studentToken))
        .send({ reply: '답변' });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 답변을 등록한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/suggestions/admin/${createdSuggestionId}/reply`)
        .set(authHeader(adminToken))
        .send({ reply: 'E2E 테스트 답변입니다.' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: createdSuggestionId,
        reply: 'E2E 테스트 답변입니다.',
      });
    });
  });

  describe('DELETE /suggestions/:id', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/suggestions/${createdSuggestionId}`,
      );
      expect(res.status).toBe(401);
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .delete('/suggestions/999999999')
        .set(authHeader(studentToken));
      expect(res.status).toBe(404);
    });

    it('작성자 본인이 삭제한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/suggestions/${createdSuggestionId}`)
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: '삭제되었습니다.' });
    });
  });
});
