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
import { Room } from '../src/rooms/entities/room.entity';
import { User, UserRole } from '../src/users/entities/user.entity';
import {
  StayStatus,
  StayStatusType,
} from '../src/stay-status/entities/stay-status.entity';

interface StayRow {
  id: number | null;
  user_id: number;
  username: string | null;
  room_number: number | null;
  status: string | null;
  parent_phone: string | null;
  week_start: string;
  updated_at: string | null;
}
interface StayRes {
  week_start: string;
  summary: { STAY: number; OUTING: number; NOT_SUBMITTED: number };
  list: StayRow[];
}

describe('Stay status admin (e2e)', () => {
  let app: INestApplication<App>;
  let roomRepository: Repository<Room>;
  let userRepository: Repository<User>;
  let stayRepository: Repository<StayStatus>;
  let adminToken: string;
  let studentToken: string;

  // 다른 테스트/시드 데이터와 겹치지 않는 주
  const WEEK = '2099-01-05';
  const createdRoomIds: number[] = [];
  const createdUserIds: number[] = [];
  const ids: Record<string, number> = {};

  const get = (week = WEEK) =>
    request(app.getHttpServer()).get(`/stay-status/admin?week=${week}`);

  beforeAll(async () => {
    app = await createTestApp();
    roomRepository = app.get(getRepositoryToken(Room));
    userRepository = app.get(getRepositoryToken(User));
    stayRepository = app.get(getRepositoryToken(StayStatus));
    adminToken = (await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password))
      .accessToken;
    studentToken = (
      await login(app, STUDENT_ACCOUNT.email, STUDENT_ACCOUNT.password)
    ).accessToken;

    // 방 번호 역순으로 만들어 미신청 학생의 방 번호순 정렬을 검증한다.
    const rooms = await roomRepository.save([
      { room_number: 703, floor: 7 },
      { room_number: 702, floor: 7 },
      { room_number: 701, floor: 7 },
    ]);
    createdRoomIds.push(...rooms.map((r) => r.id));
    const roomId = (n: number) => rooms.find((r) => r.room_number === n)!.id;

    const base = { password: 'not-a-real-hash', role: UserRole.STUDENT };
    const users = await userRepository.save([
      {
        ...base,
        email: 'stay-e2e-submitted@test.local',
        username: '신청학생',
        room_id: roomId(703),
        can_staying: true,
      },
      {
        ...base,
        email: 'stay-e2e-missing-b@test.local',
        username: '미신청B',
        room_id: roomId(702),
        can_staying: true,
      },
      {
        ...base,
        email: 'stay-e2e-missing-a@test.local',
        username: '미신청A',
        room_id: roomId(701),
        can_staying: true,
      },
      {
        ...base,
        email: 'stay-e2e-no-staying@test.local',
        username: '잔류불가학생',
        room_id: roomId(701),
        can_staying: false,
      },
      {
        ...base,
        email: 'stay-e2e-admin@test.local',
        username: '잔류관리자',
        role: UserRole.ADMIN,
        room_id: roomId(701),
        can_staying: true,
      },
    ]);
    createdUserIds.push(...users.map((u) => u.id));
    ids.submitted = users[0].id;
    ids.missingB = users[1].id;
    ids.missingA = users[2].id;
    ids.noStaying = users[3].id;
    ids.admin = users[4].id;

    await stayRepository.save({
      user_id: ids.submitted,
      status: StayStatusType.STAY,
      parent_phone: '010-0000-0000',
      week_start: WEEK,
    });
  });

  afterAll(async () => {
    if (createdUserIds.length) {
      await stayRepository.delete({ week_start: WEEK });
      await userRepository.delete(createdUserIds);
    }
    if (createdRoomIds.length) await roomRepository.delete(createdRoomIds);
    await app.close();
  });

  describe('GET /stay-status/admin', () => {
    it('학생 토큰은 403', async () => {
      await get().set(authHeader(studentToken)).expect(403);
    });

    it('week가 없으면 400', async () => {
      await request(app.getHttpServer())
        .get('/stay-status/admin')
        .set(authHeader(adminToken))
        .expect(400);
    });

    it('미신청 학생이 list에 null 필드로 포함되고 summary.NOT_SUBMITTED가 집계된다', async () => {
      const res = await get().set(authHeader(adminToken)).expect(200);
      const body = res.body as StayRes;

      const submitted = body.list.find((r) => r.user_id === ids.submitted)!;
      expect(submitted).toMatchObject({
        username: '신청학생',
        room_number: 703,
        status: 'STAY',
        parent_phone: '010-0000-0000',
        week_start: WEEK,
      });
      expect(submitted.id).toEqual(expect.any(Number));
      expect(submitted.updated_at).not.toBeNull();

      expect(body.list.find((r) => r.user_id === ids.missingA)).toEqual({
        id: null,
        user_id: ids.missingA,
        username: '미신청A',
        room_number: 701,
        status: null,
        parent_phone: null,
        week_start: WEEK,
        updated_at: null,
      });

      // 이 테스트가 만든 데이터 기준: 시드 학생/관리자는 can_staying=false라 포함되지 않는다.
      expect(body.summary).toEqual({ STAY: 1, OUTING: 0, NOT_SUBMITTED: 2 });
    });

    it('신청 학생이 먼저, 미신청 학생은 방 번호순으로 정렬된다', async () => {
      const res = await get().set(authHeader(adminToken)).expect(200);
      const order = (res.body as StayRes).list.map((r) => r.user_id);
      expect(order).toEqual([ids.submitted, ids.missingA, ids.missingB]);
    });

    it('can_staying=false 학생과 ADMIN은 미신청 목록에서 제외된다', async () => {
      const res = await get().set(authHeader(adminToken)).expect(200);
      const userIds = (res.body as StayRes).list.map((r) => r.user_id);
      expect(userIds).not.toContain(ids.noStaying);
      expect(userIds).not.toContain(ids.admin);
    });
  });
});
