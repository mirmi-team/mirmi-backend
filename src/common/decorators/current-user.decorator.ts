import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// JwtStrategy.validate()가 반환하는 값과 동일한 모양
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

/**
 * JwtAuthGuard(Passport 'jwt' 전략)가 인증에 성공하면
 * request.user에 JwtStrategy의 validate()가 반환한 값을 넣어줌.
 * 이 데코레이터는 그 request.user를 그대로 꺼내옴.
 *
 * 예: @CurrentUser() user, 또는 특정 필드만 @CurrentUser('id') id
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return field ? user[field] : user;
  },
);
