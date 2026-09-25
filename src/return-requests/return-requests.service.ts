import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { User } from 'src/users/entities/user.entity';
import { createHmac, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';
import {
  CreateReturnRequestDto,
  ReturnType,
} from './dto/create-return-request.dto';
import { VerifyReturnDto } from './dto/verify-return.dto';

const RETURN_REQUESTS_TABLE = 'return_requests';
const QR_TOKEN_TTL_MS = 30 * 1000; // 30초

export interface ReturnRequestRow {
  id: number;
  user_id: number;
  return_type: ReturnType | null;
  reason: string | null;
  actual_return_time: string | null;
  request_date: string;
}

// 복귀 타입별 체크인 시각. 안 찍었으면 null.
// 관리자 화면이 '바로복귀 / 석식복귀 / 8시복귀' 세 칸을 각각 표시하는 데 쓴다.
export interface ReturnCheckins {
  IMMEDIATE: string | null;
  DINNER: string | null;
  EIGHT_PM: string | null;
}

export interface StudentReturnStatus {
  user_id: number;
  username: string;
  room_number: number;
  /// 오늘 한 번이라도 찍었으면 복귀완료. 복귀 시간대 밖에 찍은 것도 포함한다.
  status: '복귀완료' | '미복귀';
  /// 오늘 찍은 기록을 타입별로 펼친 것
  checkins: ReturnCheckins;
}

export interface FloorReturnStatus {
  floor: number;
  students: StudentReturnStatus[];
}

interface SupaError {
  message: string;
}

interface SupaResult<T> {
  data: T;
  error: SupaError | null;
}

// Supabase 클라이언트가 Database 타입 생성 없이 쓰이고 있어 응답이 전부 any로 잡힙니다.
// 구조분해하기 전에 unknown을 거쳐 먼저 SupaResult<T>로 확정 짓고 나서 구조분해합니다.
function unwrap<T>(result: unknown): SupaResult<T> {
  return result as SupaResult<T>;
}

function today(): string {
  return toKst(new Date()).dateStr;
}

// 서버가 어느 시간대로 돌고 있든(UTC든 KST든) 상관없이 항상 한국시간 기준으로
// 계산하기 위한 헬퍼. Date.getHours() 등은 서버 시스템 시간대를 따라가서
// 배포 환경에 따라 결과가 달라지는 버그가 있었어서, UTC 값에 9시간을 직접
// 더해서 계산합니다.
function toKst(date: Date): {
  hours: number;
  minutes: number;
  dateStr: string;
} {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    hours: kst.getUTCHours(),
    minutes: kst.getUTCMinutes(),
    dateStr: kst.toISOString().slice(0, 10),
  };
}

// 입실 체크된 "시:분"(한국시간 기준)이 어느 복귀 타입 시간대에 해당하는지 판단.
// 어느 시간대에도 안 걸치면 null (타입 없이 저장).
function resolveReturnTypeByTime(date: Date): ReturnType | null {
  const { hours, minutes } = toKst(date);
  const nowMinutes = hours * 60 + minutes;
  const inRange = (
    startH: number,
    startM: number,
    endH: number,
    endM: number,
  ) => {
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    return nowMinutes >= start && nowMinutes <= end;
  };

  if (inRange(8, 0, 16, 30)) return ReturnType.IMMEDIATE; // 바로 복귀 08:00~16:30
  if (inRange(17, 20, 18, 20)) return ReturnType.DINNER; // 석식 복귀 17:20~18:20
  if (inRange(18, 20, 20, 30)) return ReturnType.EIGHT_PM; // 8시 복귀 18:20~20:30
  return null;
}

// 아무것도 안 찍은 상태의 빈 칸 묶음.
function emptyCheckins(): ReturnCheckins {
  return { IMMEDIATE: null, DINNER: null, EIGHT_PM: null };
}

@Injectable()
export class ReturnRequestsService {
  // 이미 스캔 처리된 토큰을 잠깐(만료 시각까지) 기억해서 같은 QR이
  // 30초 안에 두 번 스캔되는 걸 막습니다. 서버 인스턴스 하나짜리 소규모
  // 서비스라 메모리에 두는 걸로 충분합니다 (재시작하면 초기화되지만,
  // 재시작 시점엔 어차피 그 토큰들도 대부분 만료돼있을 시간이라 문제없음).
  private readonly usedTokens = new Map<string, number>(); // token -> 만료시각(ms)

  private pruneUsedTokens(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.usedTokens) {
      if (expiresAt < now) {
        this.usedTokens.delete(token);
      }
    }
  }

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
  }

  // 학생 QR 서명에 쓰는 비밀키. 로그인 토큰과 같은 값을 재사용합니다.
  private get qrSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.qrSecret).update(payload).digest('hex');
  }

  // GET /returns - 로그인한 본인의 오늘 복귀 기록 전체 (체크인마다 행이 쌓이므로 배열)
  async findMine(userId: number): Promise<ReturnRequestRow[]> {
    const { data, error } = unwrap<ReturnRequestRow[]>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('request_date', today())
        .order('id', { ascending: true }),
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  // POST /returns - 오늘 복귀 예정 시간 사전 등록/수정 (참고용. 실제 타입은 QR 체크인 때 자동 결정됨)
  async upsert(
    dto: CreateReturnRequestDto,
    userId: number,
  ): Promise<{ message: string; returnId: number }> {
    const { data: existing, error: findError } = unwrap<{ id: number } | null>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .select('id')
        .eq('user_id', userId)
        .eq('request_date', today())
        .maybeSingle(),
    );

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }

    if (existing) {
      const { error } = unwrap<null>(
        await this.client
          .from(RETURN_REQUESTS_TABLE)
          .update({
            return_type: dto.return_type,
            reason: dto.reason ?? null,
          })
          .eq('id', existing.id),
      );

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return {
        message: '복귀 시간이 수정되었습니다.',
        returnId: existing.id,
      };
    }

    const { data: inserted, error } = unwrap<{ id: number }>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .insert({
          user_id: userId,
          return_type: dto.return_type,
          reason: dto.reason ?? null,
          request_date: today(),
        })
        .select('id')
        .single(),
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      message: '복귀 시간이 등록되었습니다.',
      returnId: inserted.id,
    };
  }

  // GET /returns/qr - 학생 본인의 30초짜리 QR 발급 (user_id + 발급시각을 서명)
  async generateMyQr(userId: number): Promise<{
    token: string;
    qrImage: string;
    expiresAt: string;
  }> {
    const issuedAt = Date.now();
    const payload = `${userId}.${issuedAt}`;
    const token = `${payload}.${this.sign(payload)}`;

    const qrImage = await QRCode.toDataURL(token);

    return {
      token,
      qrImage,
      expiresAt: new Date(issuedAt + QR_TOKEN_TTL_MS).toISOString(),
    };
  }

  // POST /admin/returns/verify - 사감이 학생 QR을 스캔해서 실제 복귀 확인.
  // 지금 시각이 어느 복귀 타입 시간대에 해당하는지 자동으로 판단해서 저장.
  async verifyByAdmin(
    dto: VerifyReturnDto,
  ): Promise<{ message: string; returnType: ReturnType | null }> {
    const parts = dto.token.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException('유효하지 않은 QR입니다.');
    }
    const [userIdStr, issuedAtStr, signature] = parts;
    const payload = `${userIdStr}.${issuedAtStr}`;
    const expected = this.sign(payload);

    const signatureBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const isValidSignature =
      signatureBuf.length === expectedBuf.length &&
      timingSafeEqual(signatureBuf, expectedBuf);

    if (!isValidSignature) {
      throw new BadRequestException('유효하지 않은 QR입니다.');
    }

    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > QR_TOKEN_TTL_MS) {
      throw new BadRequestException(
        '만료된 QR입니다. 학생에게 QR을 다시 띄워달라고 해주세요.',
      );
    }

    this.pruneUsedTokens();
    if (this.usedTokens.has(dto.token)) {
      throw new BadRequestException(
        '이미 처리된 QR입니다. 다시 스캔할 필요 없습니다.',
      );
    }
    this.usedTokens.set(dto.token, issuedAt + QR_TOKEN_TTL_MS);

    const userId = Number(userIdStr);
    const returnType = resolveReturnTypeByTime(new Date());

    // 오늘 이미 같은 return_type으로 체크인한 기록이 있으면 그 행의 시각만
    // 갱신하고, 없으면(처음이거나 이전과 다른 타입이면) 새 행을 추가합니다.
    let existingQuery = this.client
      .from(RETURN_REQUESTS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('request_date', today());
    existingQuery =
      returnType == null
        ? existingQuery.is('return_type', null)
        : existingQuery.eq('return_type', returnType);

    const { data: existing, error: findError } = unwrap<{ id: number } | null>(
      await existingQuery
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }

    if (existing) {
      const { error } = unwrap<null>(
        await this.client
          .from(RETURN_REQUESTS_TABLE)
          .update({ actual_return_time: new Date().toISOString() })
          .eq('id', existing.id),
      );

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
    } else {
      const { error } = unwrap<null>(
        await this.client.from(RETURN_REQUESTS_TABLE).insert({
          user_id: userId,
          request_date: today(),
          actual_return_time: new Date().toISOString(),
          return_type: returnType,
        }),
      );

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
    }

    return { message: '복귀가 확인되었습니다.', returnType };
  }

  // GET /admin/returns/today?floor=5 - 오늘 전체 학생 복귀 현황을 층별로 조회.
  // floor를 안 주면 전체 층을 다 보여줍니다.
  async getTodayStatusByFloor(floor?: number): Promise<FloorReturnStatus[]> {
    const students = await this.userRepo.find({
      relations: { room: true },
      order: { room: { room_number: 'ASC' } },
    });

    const filtered = floor
      ? students.filter((s) => s.room?.floor === floor)
      : students;

    const { data: todayRows, error } = unwrap<ReturnRequestRow[]>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .select('*')
        .eq('request_date', today()),
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // 한 번이라도 찍은 학생. 복귀완료/미복귀는 이것으로 가른다.
    // (복귀 시간대 밖에 찍어 타입이 없는 기록도 복귀는 복귀다)
    const checkedInUserIds = new Set<number>();

    // 타입별 체크인 시각. 같은 타입은 행이 새로 생기지 않고 갱신되므로
    // 타입당 한 건이다.
    const checkinsByUserId = new Map<number, ReturnCheckins>();

    for (const row of todayRows) {
      checkedInUserIds.add(row.user_id);

      if (!row.return_type) continue;
      const slots = checkinsByUserId.get(row.user_id) ?? emptyCheckins();
      slots[row.return_type] = row.actual_return_time;
      checkinsByUserId.set(row.user_id, slots);
    }

    const floorMap = new Map<number, StudentReturnStatus[]>();
    for (const student of filtered) {
      if (!student.room) continue; // 방 배정 안 된 학생은 층을 알 수 없어 제외

      const entry: StudentReturnStatus = {
        user_id: student.id,
        username: student.username,
        room_number: student.room.room_number,
        status: checkedInUserIds.has(student.id) ? '복귀완료' : '미복귀',
        checkins: checkinsByUserId.get(student.id) ?? emptyCheckins(),
      };

      const list = floorMap.get(student.room.floor) ?? [];
      list.push(entry);
      floorMap.set(student.room.floor, list);
    }

    return Array.from(floorMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([floorNo, studentsInFloor]) => ({
        floor: floorNo,
        students: studentsInFloor,
      }));
  }
}
