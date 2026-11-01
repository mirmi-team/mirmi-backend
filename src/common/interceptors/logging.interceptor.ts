import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SLOW_REQUEST_MS = 500;

// 메서드, 경로, 상태코드, 소요시간만 기록한다. 헤더/토큰/body/쿼리스트링은 남기지 않는다
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = Date.now();

    const log = (statusCode: number) => {
      const elapsed = Date.now() - startedAt;
      const message = `${req.method} ${req.path} ${statusCode} ${elapsed}ms`;
      if (elapsed >= SLOW_REQUEST_MS) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    };

    return next.handle().pipe(
      tap({
        next: () => log(res.statusCode),
        error: (err: unknown) =>
          log(err instanceof HttpException ? err.getStatus() : 500),
      }),
    );
  }
}
