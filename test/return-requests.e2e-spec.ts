import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import {
  ADMIN_ACCOUNT,
  authHeader,
  createTestApp,
  login,
} from './utils/e2e-setup';
import { Room } from '../src/rooms/entities/room.entity';
import { User, UserRole } from '../src/users/entities/user.entity';

interface StudentRes {
  user_id: number;
  username: string;
  room_number: number;
}
interface FloorRes {
  floor: number;
  students: StudentRes[];
}

describe('Return requests admin (e2e)', () => {
  let app: INestApplication<App>;
  let roomRepository: Repository<Room>;
  let userRepository: Repository<User>;
  let adminToken: string;

  // 시드(201, 301호)와 겹치지 않는 테스트 전용 층/호실
  const FLOOR = 8;
  const createdRoomIds: number[] = [];
  const createdUserIds: number[] = [];
  let studentId: number;
  let adminId: number;

  beforeAll(async () => {
    app = await createTestApp();
    roomRepository = app.get(getRepositoryToken(Room));
    userRepository = app.get(getRepositoryToken(User));
    adminToken = (await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password))
      .accessToken;

    const room = await roomRepository.save({ room_number: 801, floor: FLOOR });
    createdRoomIds.push(room.id);

    const base = { password: 'not-a-real-hash', room_id: room.id };
    const users = await userRepository.save([
      {
        ...base,
        email: 'returns-e2e-student@test.local',
        username: '복귀학생',
        role: UserRole.STUDENT,
      },
      {
        ...base,
        email: 'returns-e2e-admin@test.local',
        username: '방배정관리자',
        role: UserRole.ADMIN,
      },
    ]);
    createdUserIds.push(...users.map((u) => u.id));
    studentId = users[0].id;
    adminId = users[1].id;
  });

  afterAll(async () => {
    if (createdUserIds.length) await userRepository.delete(createdUserIds);
    if (createdRoomIds.length) await roomRepository.delete(createdRoomIds);
    await app.close();
  });

  describe('GET /admin/returns/today', () => {
    it('방이 배정된 ADMIN은 복귀 현황 목록에 없다', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/returns/today?floor=${FLOOR}`)
        .set(authHeader(adminToken))
        .expect(200);

      const ids = (res.body as FloorRes[]).flatMap((f) =>
        f.students.map((s) => s.user_id),
      );
      expect(ids).toContain(studentId);
      expect(ids).not.toContain(adminId);
    });
  });
});
