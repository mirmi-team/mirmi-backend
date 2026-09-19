import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import {
  CreateReturnRequestDto,
  ReturnType,
} from './dto/create-return-request.dto';
import { VerifyReturnDto } from './dto/verify-return.dto';

const RETURN_REQUESTS_TABLE = 'return_requests';
const QR_TOKEN_TABLE = 'return_qr_token';
const QR_TOKEN_TTL_MS = 5 * 60 * 1000; // 5분

export interface ReturnRequestRow {
  id: number;
  user_id: number;
  return_type: ReturnType;
  reason: string | null;
  actual_return_time: string | null;
  request_date: string;
}

interface QrTokenRow {
  id: number;
  token: string;
  expires_at: string;
  created_at: string;
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

@Injectable()
export class ReturnRequestsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client(): SupabaseClient {
    return this.supabaseService.client as SupabaseClient;
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

  // POST /returns - 오늘 복귀 시간 등록/수정 (오늘 기록 있으면 수정, 없으면 새로 생성)
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

  // GET /admin/returns/qr - 현재 유효한 QR 토큰을 반환.
  // 없거나 5분이 지나 만료됐으면 새로 발급. 호출부(사감 화면)가 주기적으로
  // 다시 호출하기만 하면 자연스럽게 5분마다 새 QR로 바뀝니다.
  async getOrRefreshQr(): Promise<{
    token: string;
    expiresAt: string;
    qrImage: string;
  }> {
    const { data: latest, error: findError } = unwrap<QrTokenRow | null>(
      await this.client
        .from(QR_TOKEN_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }

    const now = Date.now();
    if (latest && new Date(latest.expires_at).getTime() > now) {
      const qrImage = await QRCode.toDataURL(latest.token);
      return { token: latest.token, expiresAt: latest.expires_at, qrImage };
    }

    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(now + QR_TOKEN_TTL_MS).toISOString();

    const { error } = unwrap<null>(
      await this.client
        .from(QR_TOKEN_TABLE)
        .insert({ token, expires_at: expiresAt }),
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const qrImage = await QRCode.toDataURL(token);
    return { token, expiresAt, qrImage };
  }

  // POST /returns/verify - 학생이 QR을 스캔해서 실제 복귀 시간을 기록
  async verify(
    dto: VerifyReturnDto,
    userId: number,
  ): Promise<{ message: string }> {
    const { data: latest, error: findError } = unwrap<QrTokenRow | null>(
      await this.client
        .from(QR_TOKEN_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (findError) {
      throw new InternalServerErrorException(findError.message);
    }

    if (!latest || latest.token !== dto.token) {
      throw new BadRequestException('유효하지 않은 QR코드입니다.');
    }
    if (new Date(latest.expires_at).getTime() <= Date.now()) {
      throw new BadRequestException(
        '만료된 QR코드입니다. 화면을 새로고침한 뒤 다시 스캔해주세요.',
      );
    }

    const { data: existing, error: existingError } = unwrap<{
      id: number;
    } | null>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .select('id')
        .eq('user_id', userId)
        .eq('request_date', today())
        .maybeSingle(),
    );

    if (existingError) {
      throw new InternalServerErrorException(existingError.message);
    }
    if (!existing) {
      throw new BadRequestException(
        '먼저 복귀 시간을 등록해주세요. (POST /returns)',
      );
    }

    const { error } = unwrap<null>(
      await this.client
        .from(RETURN_REQUESTS_TABLE)
        .update({ actual_return_time: new Date().toISOString() })
        .eq('id', existing.id),
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: '복귀가 확인되었습니다.' };
  }
}
