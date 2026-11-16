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
  MeritLog,
  MeritType,
} from '../src/merit-logs/entities/merit-log.entity';
import { MeritReason } from '../src/merit-logs/entities/merit-reason.entity';
import { User } from '../src/users/entities/user.entity';

describe('MeritLogs (e2e)', () => {
  let app: INestApplication<App>;
  let meritLogRepository: Repository<MeritLog>;
  let meritReasonRepository: Repository<MeritReason>;
  let userRepository: Repository<User>;

  let studentToken: string;
  let studentUserId: number;
  let adminToken: string;
  let adminUserId: number;

  let originalTotalMeritScore: number;
  let createdReasonId: number;
  let createdLogId: number;
  let penaltyLogId: number;
  const extraLogIds: number[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    meritLogRepository = app.get(getRepositoryToken(MeritLog));
    meritReasonRepository = app.get(getRepositoryToken(MeritReason));
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
    adminUserId = adminLogin.userId;

    const student = await userRepository.findOne({
      where: { id: studentUserId },
    });
    originalTotalMeritScore = student!.total_merit_score;
  });

  afterAll(async () => {
    if (createdLogId) {
      await meritLogRepository.delete(createdLogId);
    }
    if (penaltyLogId) {
      await meritLogRepository.delete(penaltyLogId);
    }
    if (extraLogIds.length) {
      await meritLogRepository.delete(extraLogIds);
    }
    if (createdReasonId) {
      await meritReasonRepository.delete(createdReasonId);
    }
    await userRepository.update(studentUserId, {
      total_merit_score: originalTotalMeritScore,
    });
    await app.close();
  });

  describe('GET /merit-logs/reasons', () => {
    it('사유 목록을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/merit-logs/reasons');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /merit-logs/admin/reasons', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/merit-logs/admin/reasons')
        .set(authHeader(studentToken))
        .send({ type: 'REWARD', reason: 'e2e test reason', default_score: 5 });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 사유를 추가한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/merit-logs/admin/reasons')
        .set(authHeader(adminToken))
        .send({ type: 'REWARD', reason: 'e2e test reason', default_score: 5 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        type: 'REWARD',
        reason: 'e2e test reason',
        default_score: 5,
      });
      createdReasonId = res.body.id;
    });
  });

  describe('POST /merit-logs/admin', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/merit-logs/admin')
        .set(authHeader(studentToken))
        .send({
          user_id: studentUserId,
          type: 'REWARD',
          score: 3,
          reason: 'e2e',
        });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 상벌점을 부여하고 누적 점수에 반영한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/merit-logs/admin')
        .set(authHeader(adminToken))
        .send({
          user_id: studentUserId,
          type: 'REWARD',
          score: 3,
          reason: 'e2e test log',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        user_id: studentUserId,
        type: 'REWARD',
        score: 3,
        reason: 'e2e test log',
      });
      createdLogId = res.body.id;

      const summaryRes = await request(app.getHttpServer())
        .get('/merit-logs/me/summary')
        .set(authHeader(studentToken));
      expect(summaryRes.body.total_merit_score).toBe(
        originalTotalMeritScore + 3,
      );
    });

    it('PENALTY 타입이면 양수 score를 보내도 누적 점수에서 차감된다', async () => {
      const beforeRes = await request(app.getHttpServer())
        .get('/merit-logs/me/summary')
        .set(authHeader(studentToken));
      const beforeScore = beforeRes.body.total_merit_score;

      const res = await request(app.getHttpServer())
        .post('/merit-logs/admin')
        .set(authHeader(adminToken))
        .send({
          user_id: studentUserId,
          type: 'PENALTY',
          score: 2,
          reason: 'e2e penalty test log',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        user_id: studentUserId,
        type: 'PENALTY',
        score: -2,
        reason: 'e2e penalty test log',
      });
      penaltyLogId = res.body.id;

      const summaryRes = await request(app.getHttpServer())
        .get('/merit-logs/me/summary')
        .set(authHeader(studentToken));
      expect(summaryRes.body.total_merit_score).toBe(beforeScore - 2);
    });
  });

  describe('PATCH /merit-logs/admin/:userId', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merit-logs/admin/${studentUserId}`)
        .set(authHeader(studentToken))
        .send({ score: 10 });
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 상벌점을 설정한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/merit-logs/admin/${studentUserId}`)
        .set(authHeader(adminToken))
        .send({ score: 42 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: '상벌점이 설정되었습니다.',
        total_merit_score: 42,
      });
    });
  });

  describe('GET /merit-logs/me', () => {
    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get('/merit-logs/me');
      expect(res.status).toBe(401);
    });

    it('학생 본인의 상벌점 내역을 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/merit-logs/me')
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        res.body.some((log: { id: number }) => log.id === createdLogId),
      ).toBe(true);
    });
  });

  describe('GET /merit-logs/admin/:userId', () => {
    const url = (id: number | string) => `/merit-logs/admin/${id}`;
    let olderLogId: number;
    let newerLogId: number;
    let adminLogId: number;

    beforeAll(async () => {
      // created_at이 @BeforeInsert로 덮어써지므로 저장 후 시각을 직접 지정한다.
      const make = async (userId: number, createdAt: string) => {
        const log = await meritLogRepository.save(
          meritLogRepository.create({
            user_id: userId,
            type: MeritType.REWARD,
            score: 1,
            reason: 'E2E 관리자 조회 테스트',
          }),
        );
        await meritLogRepository.update(log.id, {
          created_at: new Date(createdAt),
        });
        extraLogIds.push(log.id);
        return log.id;
      };
      olderLogId = await make(studentUserId, '2098-01-01T00:00:00Z');
      newerLogId = await make(studentUserId, '2099-01-01T00:00:00Z');
      adminLogId = await make(adminUserId, '2099-06-01T00:00:00Z');
    });

    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app.getHttpServer()).get(url(studentUserId));
      expect(res.status).toBe(401);
    });

    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get(url(studentUserId))
        .set(authHeader(studentToken));
      expect(res.status).toBe(403);
    });

    it('존재하지 않는 userId면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get(url(999999999))
        .set(authHeader(adminToken));
      expect(res.status).toBe(404);
      expect((res.body as { message: string }).message).toBe(
        '사용자를 찾을 수 없습니다.',
      );
    });

    it('userId가 숫자가 아니면 400을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .get(url('abc'))
        .set(authHeader(adminToken));
      expect(res.status).toBe(400);
    });

    it('관리자가 학생의 내역을 최신순으로 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get(url(studentUserId))
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      const logs = res.body as { id: number; created_at: string }[];
      const ids = logs.map((l) => l.id);
      expect(ids.indexOf(newerLogId)).toBeGreaterThanOrEqual(0);
      expect(ids.indexOf(newerLogId)).toBeLessThan(ids.indexOf(olderLogId));

      const times = logs.map((l) => new Date(l.created_at).getTime());
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('해당 학생의 내역만 반환하고 /me와 같은 형태다', async () => {
      const res = await request(app.getHttpServer())
        .get(url(studentUserId))
        .set(authHeader(adminToken));
      const logs = res.body as { id: number; user_id: number }[];

      expect(logs.every((l) => l.user_id === studentUserId)).toBe(true);
      expect(logs.map((l) => l.id)).not.toContain(adminLogId);

      const me = await request(app.getHttpServer())
        .get('/merit-logs/me')
        .set(authHeader(studentToken));
      expect(res.body).toEqual(me.body);

      // 다른 사용자(관리자 계정)를 조회하면 그 사용자의 내역만 나온다.
      const adminRes = await request(app.getHttpServer())
        .get(url(adminUserId))
        .set(authHeader(adminToken));
      const adminLogs = adminRes.body as { id: number; user_id: number }[];
      expect(adminLogs.map((l) => l.id)).toContain(adminLogId);
      expect(adminLogs.every((l) => l.user_id === adminUserId)).toBe(true);
    });
  });

  describe('GET /merit-logs/me/summary', () => {
    it('학생 본인의 누적 상벌점을 조회한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/merit-logs/me/summary')
        .set(authHeader(studentToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ total_merit_score: 42 });
    });
  });

  describe('DELETE /merit-logs/admin/reasons/:id', () => {
    it('학생 토큰이면 403을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/merit-logs/admin/reasons/${createdReasonId}`)
        .set(authHeader(studentToken));
      expect(res.status).toBe(403);
    });

    it('관리자 토큰이면 사유를 삭제한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/merit-logs/admin/reasons/${createdReasonId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: '사유가 삭제되었습니다.' });
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/merit-logs/admin/reasons/${createdReasonId}`)
        .set(authHeader(adminToken));
      expect(res.status).toBe(404);
    });
  });
});
