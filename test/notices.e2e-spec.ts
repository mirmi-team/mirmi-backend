import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Between, Repository } from 'typeorm';
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
    adminToken = (await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password))
      .accessToken;
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

      // 다른 관리자가 같은 날 공지를 추가로 올렸을 수도 있으므로,
      // "내가 만든 공지"가 아니라 "오늘 범위에서 실제로 가장 최신인 공지"와 비교한다.
      // 서버 TZ와 무관하게 한국 시간(KST) 기준 오늘 범위를 사용한다.
      const koreaDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
      }).format(new Date());
      const startOfDay = new Date(`${koreaDate}T00:00:00+09:00`);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const latestOfToday = await noticeRepository.findOne({
        where: { created_at: Between(startOfDay, endOfDay) },
        order: { created_at: 'DESC', id: 'DESC' },
      });

      expect(res.body).toMatchObject({ id: latestOfToday?.id });
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

  describe('GET /notices/admin', () => {
    const seededIds: number[] = [];

    beforeAll(async () => {
      // 페이지네이션 검증용으로 과거 날짜 포함 공지 3건을 직접 만든다.
      for (const [i, daysAgo] of [0, 2, 5].entries()) {
        const notice = await noticeRepository.save(
          noticeRepository.create({
            title: `E2E 관리자 목록 ${i}`,
            description: 'E2E 관리자 목록 테스트',
            image_url: null,
          }),
        );
        // created_at은 BeforeInsert에서 덮어쓰이므로 저장 후 갱신한다.
        await noticeRepository.update(notice.id, {
          created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        });
        seededIds.push(notice.id);
      }
    });

    afterAll(async () => {
      await noticeRepository.delete(seededIds);
    });

    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/notices/admin');
      expect(res.status).toBe(401);
    });

    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/notices/admin')
        .set(authHeader(studentToken));
      expect(res.status).toBe(403);
    });

    it('관리자는 기본 page=1, limit=20으로 전체 기간 목록을 받는다', async () => {
      const res = await request(app.getHttpServer())
        .get('/notices/admin')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      const body = res.body as {
        items: { id: number; created_at: string }[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(body.total).toBeGreaterThanOrEqual(seededIds.length);

      // 과거 날짜 공지도 포함되고, created_at DESC로 정렬된다.
      const ids = body.items.map((n) => n.id);
      for (const id of seededIds) {
        expect(ids).toContain(id);
      }
      const times = body.items.map((n) => new Date(n.created_at).getTime());
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('page/limit에 따라 잘라서 반환한다', async () => {
      const all = await request(app.getHttpServer())
        .get('/notices/admin?page=1&limit=100')
        .set(authHeader(adminToken));
      const allIds = (all.body as { items: { id: number }[] }).items.map(
        (n) => n.id,
      );

      const second = await request(app.getHttpServer())
        .get('/notices/admin?page=2&limit=1')
        .set(authHeader(adminToken));

      expect(second.status).toBe(200);
      const body = second.body as {
        items: { id: number }[];
        total: number;
        page: number;
        limit: number;
      };
      expect(body.page).toBe(2);
      expect(body.limit).toBe(1);
      expect(body.total).toBe(allIds.length);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe(allIds[1]);
    });

    it('잘못된 page/limit이면 400을 반환한다', async () => {
      for (const qs of ['page=0', 'limit=101', 'limit=abc', 'page=1.5']) {
        const res = await request(app.getHttpServer())
          .get(`/notices/admin?${qs}`)
          .set(authHeader(adminToken));
        expect(res.status).toBe(400);
      }
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

    it('이미지 파일을 첨부하면 image_url이 갱신된다', async () => {
      const testImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .patch(`/notices/${createdNoticeId}`)
        .set(authHeader(adminToken))
        .attach('image', testImage, 'test.png');

      expect(res.status).toBe(200);

      const updated = await noticeRepository.findOne({
        where: { id: createdNoticeId },
      });
      expect(updated?.image_url).toEqual(expect.stringContaining('notice_'));
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
