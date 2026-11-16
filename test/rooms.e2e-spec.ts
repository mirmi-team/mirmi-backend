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

interface RoomRes {
  room_id: number;
  room_number: number;
  floor: number | null;
  students: Record<string, unknown>[];
}

describe('Rooms admin (e2e)', () => {
  let app: INestApplication<App>;
  let roomRepository: Repository<Room>;
  let userRepository: Repository<User>;

  let studentToken: string;
  let adminToken: string;

  // 시드(201, 301호)와 겹치지 않는 테스트 전용 층/호실
  const FLOOR = 9;
  const filledRoomNumber = 901;
  const emptyRoomNumber = 902;
  const adminOnlyRoomNumber = 903;
  const createdRoomIds: number[] = [];
  const createdUserIds: number[] = [];

  const get = (query = '') =>
    request(app.getHttpServer()).get(`/rooms/admin${query}`);

  beforeAll(async () => {
    app = await createTestApp();
    roomRepository = app.get(getRepositoryToken(Room));
    userRepository = app.get(getRepositoryToken(User));

    studentToken = (
      await login(app, STUDENT_ACCOUNT.email, STUDENT_ACCOUNT.password)
    ).accessToken;
    adminToken = (await login(app, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password))
      .accessToken;

    // room_number 역순으로 생성해 정렬을 검증한다.
    const rooms = await roomRepository.save([
      { room_number: adminOnlyRoomNumber, floor: FLOOR },
      { room_number: emptyRoomNumber, floor: FLOOR },
      { room_number: filledRoomNumber, floor: FLOOR },
    ]);
    createdRoomIds.push(...rooms.map((r) => r.id));
    const filledRoom = rooms.find((r) => r.room_number === filledRoomNumber)!;
    const adminOnlyRoom = rooms.find(
      (r) => r.room_number === adminOnlyRoomNumber,
    )!;

    const base = {
      password: 'not-a-real-hash',
      role: UserRole.STUDENT,
    };
    // 정렬 기대값: (grade, class_no, username) 오름차순, null은 뒤
    const users = await userRepository.save([
      {
        ...base,
        room_id: filledRoom.id,
        email: 'rooms-e2e-4@test.local',
        username: '라',
        grade: null,
        class_no: null,
      },
      {
        ...base,
        room_id: filledRoom.id,
        email: 'rooms-e2e-3@test.local',
        username: '다',
        grade: 2,
        class_no: 3,
      },
      {
        ...base,
        room_id: filledRoom.id,
        email: 'rooms-e2e-2@test.local',
        username: '나',
        grade: 1,
        class_no: 2,
      },
      {
        ...base,
        room_id: filledRoom.id,
        email: 'rooms-e2e-1@test.local',
        username: '가',
        grade: 1,
        class_no: 2,
      },
      {
        ...base,
        room_id: filledRoom.id,
        email: 'rooms-e2e-admin@test.local',
        username: '같은방관리자',
        role: UserRole.ADMIN,
        grade: 1,
        class_no: 1,
      },
      {
        ...base,
        room_id: adminOnlyRoom.id,
        email: 'rooms-e2e-admin2@test.local',
        username: '관리자만있는방',
        role: UserRole.ADMIN,
        grade: 1,
        class_no: 1,
      },
    ]);
    createdUserIds.push(...users.map((u) => u.id));
  });

  afterAll(async () => {
    if (createdUserIds.length) await userRepository.delete(createdUserIds);
    if (createdRoomIds.length) await roomRepository.delete(createdRoomIds);
    await app.close();
  });

  it('토큰 없이 요청하면 401을 반환한다', async () => {
    const res = await get();
    expect(res.status).toBe(401);
  });

  it('STUDENT 토큰이면 403을 반환한다', async () => {
    const res = await get().set(authHeader(studentToken));
    expect(res.status).toBe(403);
  });

  it('ADMIN 토큰이면 200과 호실 목록을 반환한다', async () => {
    const res = await get().set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as RoomRes[]).length).toBeGreaterThanOrEqual(5);
  });

  it('응답은 정해진 필드만 포함한다', async () => {
    const res = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    const room = (res.body as RoomRes[]).find(
      (r) => r.room_number === filledRoomNumber,
    )!;

    expect(Object.keys(room).sort()).toEqual(
      ['floor', 'room_id', 'room_number', 'students'].sort(),
    );
    expect(Object.keys(room.students[0]).sort()).toEqual(
      [
        'class_no',
        'grade',
        'id',
        'profile_image',
        'total_merit_score',
        'username',
      ].sort(),
    );
    expect(JSON.stringify(res.body)).not.toMatch(
      /email|password|role|rooms-e2e/,
    );
  });

  it('학생이 없는 호실도 students: []로 포함한다', async () => {
    const res = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    const room = (res.body as RoomRes[]).find(
      (r) => r.room_number === emptyRoomNumber,
    );
    expect(room).toBeDefined();
    expect(room!.students).toEqual([]);
  });

  it('ADMIN 계정은 students에 포함되지 않는다', async () => {
    const res = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    const rooms = res.body as RoomRes[];

    // ADMIN만 있는 호실은 students: []로 남는다.
    const adminOnly = rooms.find((r) => r.room_number === adminOnlyRoomNumber);
    expect(adminOnly!.students).toEqual([]);

    const names = rooms.flatMap((r) => r.students.map((s) => s.username));
    expect(names).not.toContain('같은방관리자');
    expect(names).not.toContain('관리자만있는방');

    // 시드 ADMIN(301호)도 전체 조회에서 학생으로 나오지 않는다.
    const all = await get().set(authHeader(adminToken));
    const allNames = (all.body as RoomRes[]).flatMap((r) =>
      r.students.map((s) => s.username),
    );
    expect(allNames).not.toContain('테스트관리자');
    expect(allNames).toContain('테스트학생');
  });

  it('floor로 필터링한다', async () => {
    const res = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    const rooms = res.body as RoomRes[];
    expect(rooms).toHaveLength(3);
    expect(rooms.every((r) => r.floor === FLOOR)).toBe(true);

    const none = await get('?floor=99').set(authHeader(adminToken));
    expect(none.status).toBe(200);
    expect(none.body).toEqual([]);
  });

  it('floor 생략 시 전체 층을 반환한다', async () => {
    const res = await get().set(authHeader(adminToken));
    const floors = new Set((res.body as RoomRes[]).map((r) => r.floor));
    expect(floors.has(FLOOR)).toBe(true);
    expect(floors.has(2)).toBe(true);
    expect(floors.has(3)).toBe(true);
  });

  it('room_number 오름차순으로 정렬한다', async () => {
    const res = await get().set(authHeader(adminToken));
    const numbers = (res.body as RoomRes[]).map((r) => r.room_number);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));

    const floorRes = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    expect((floorRes.body as RoomRes[]).map((r) => r.room_number)).toEqual([
      filledRoomNumber,
      emptyRoomNumber,
      adminOnlyRoomNumber,
    ]);
  });

  it('학생은 grade, class_no, username 오름차순이며 null은 뒤로 간다', async () => {
    const res = await get(`?floor=${FLOOR}`).set(authHeader(adminToken));
    const room = (res.body as RoomRes[]).find(
      (r) => r.room_number === filledRoomNumber,
    )!;
    expect(room.students.map((s) => s.username)).toEqual([
      '가',
      '나',
      '다',
      '라',
    ]);
  });

  it('floor가 숫자가 아니면 400을 반환한다', async () => {
    const res = await get('?floor=abc').set(authHeader(adminToken));
    expect(res.status).toBe(400);
  });

  it('GET /rooms/:id는 기존 동작을 유지한다', async () => {
    const res = await request(app.getHttpServer()).get('/rooms/1');
    expect(res.status).toBe(200);
    expect(res.text).toBe('This action returns a #1 room');
  });
});
