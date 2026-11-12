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
import {
  Suggestion,
  SuggestionCategory,
} from '../src/suggestions/entities/suggestion.entity';

describe('Suggestions (e2e)', () => {
  let app: INestApplication<App>;
  let suggestionRepository: Repository<Suggestion>;

  let studentToken: string;
  let adminToken: string;
  let createdSuggestionId: number;
  let adminSuggestionId: number;
  let orphanSuggestionId: number;

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
    const ids = [createdSuggestionId, adminSuggestionId, orphanSuggestionId];
    await suggestionRepository.delete(ids.filter(Boolean));
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

    it('관리자 토큰으로도 건의사항을 등록한다 (타인 접근 검증용)', async () => {
      const res = await request(app.getHttpServer())
        .post('/suggestions')
        .set(authHeader(adminToken))
        .send({
          title: 'E2E 관리자 건의',
          description: '내용',
          category: 'ETC',
        });

      expect(res.status).toBe(201);
      adminSuggestionId = (res.body as { id: number }).id;
    });

    it('작성자 정보를 알 수 없는 건의사항을 준비한다', async () => {
      const orphan = await suggestionRepository.save(
        suggestionRepository.create({
          created_by: 999999999,
          title: 'E2E 작성자 없음',
          description: '내용',
          category: SuggestionCategory.ETC,
        }),
      );
      orphanSuggestionId = orphan.id;
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

    it('학생 목록에는 본인 것만 있고 author가 없으며 replied_at이 포함된다', async () => {
      const res = await request(app.getHttpServer())
        .get('/suggestions')
        .set(authHeader(studentToken));

      const items = res.body as Record<string, unknown>[];
      const ids = items.map((s) => s.id);
      expect(ids).not.toContain(adminSuggestionId);
      expect(ids).not.toContain(orphanSuggestionId);
      for (const item of items) {
        expect(item).toHaveProperty('replied_at');
        expect(item).not.toHaveProperty('author');
      }
    });

    it('관리자 목록에는 작성자 정보(author)가 포함된다', async () => {
      const res = await request(app.getHttpServer())
        .get('/suggestions')
        .set(authHeader(adminToken));

      const items = res.body as {
        id: number;
        author: Record<string, unknown> | null;
      }[];
      expect(items.find((s) => s.id === createdSuggestionId)?.author).toEqual({
        username: '테스트학생',
        room_number: 201,
        grade: 2,
        class_no: 5,
      });
      expect(items.find((s) => s.id === adminSuggestionId)?.author).toEqual({
        username: '테스트관리자',
        room_number: 301,
        grade: 2,
        class_no: 1,
      });
      // 작성자가 users에 없으면 author는 null이다 (목록에서 빠지지 않는다)
      expect(items.find((s) => s.id === orphanSuggestionId)?.author).toBeNull();
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
        replied_at: null,
      });
      expect(res.body).not.toHaveProperty('author');
    });

    it('학생이 타인의 건의사항을 조회하면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${adminSuggestionId}`)
        .set(authHeader(studentToken));
      expect(res.status).toBe(403);
    });

    it('관리자 상세 조회에는 author가 포함된다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${createdSuggestionId}`)
        .set(authHeader(adminToken));

      expect(res.body).toMatchObject({
        id: createdSuggestionId,
        author: {
          username: '테스트학생',
          room_number: 201,
          grade: 2,
          class_no: 5,
        },
      });
    });

    it('관리자 상세 조회에서 작성자가 없으면 author는 null이다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${orphanSuggestionId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: orphanSuggestionId, author: null });
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
        replied_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        ) as string,
      });
    });

    it('답변 후 조회하면 replied_at이 채워져 있다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suggestions/${createdSuggestionId}`)
        .set(authHeader(studentToken));

      expect(res.body).toMatchObject({ reply: 'E2E 테스트 답변입니다.' });
      expect(
        (res.body as { replied_at: string | null }).replied_at,
      ).not.toBeNull();
    });

    it('답변을 수정하면 replied_at이 갱신된다', async () => {
      const before = await suggestionRepository.findOneByOrFail({
        id: createdSuggestionId,
      });
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app.getHttpServer())
        .patch(`/suggestions/admin/${createdSuggestionId}/reply`)
        .set(authHeader(adminToken))
        .send({ reply: 'E2E 수정된 답변' });

      expect(res.status).toBe(200);
      const after = (res.body as { replied_at: string }).replied_at;
      expect(after > (before.replied_at as string)).toBe(true);
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch('/suggestions/admin/999999999/reply')
        .set(authHeader(adminToken))
        .send({ reply: '답변' });
      expect(res.status).toBe(404);
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
