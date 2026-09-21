import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
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
  return new Date().toISOString().slice(0, 10);
}

// 입실 체크된 "시:분"이 어느 복귀 타입 시간대에 해당하는지 판단.
// 어느 시간대에도 안 걸치면 null (타입 없이 저장).
function resolveReturnTypeByTime(date: Date): ReturnType | null {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const inRange = (
    startH: number,
    startM: number,
    endH: number,
    endM: number,
  ) => {
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    return minutes >= start && minutes <= end;
  };

  if (inRange(8, 0, 16, 30)) return ReturnType.IMMEDIATE; // 바로 복귀 08:00~16:30
  if (inRange(17, 20, 18, 20)) return ReturnType.DINNER; // 석식 복귀 17:20~18:20
  if (inRange(18, 20, 20, 30)) return ReturnType.EIGHT_PM; // 8시 복귀 18:20~20:30
  return null;
}

@Injectable()
export class ReturnRequestsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
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

  // GET /returns - 로그인한 본인의 오늘 복귀 기록 (아직 없으면 null)
  async findMine(userId: number): Promise<ReturnRequestRow | null> {
    const { data, error } = unwrap<ReturnRequestRow | null>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('request_date', today())
        .maybeSingle(),
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

    const userId = Number(userIdStr);
    const returnType = resolveReturnTypeByTime(new Date());

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
            actual_return_time: new Date().toISOString(),
            return_type: returnType,
          })
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
}
