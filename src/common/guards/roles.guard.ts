import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 이 라우트에 필요한 역할 읽기 (@Roles로 붙인 값)
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // @Roles가 없으면 그냥 통과 (권한 제한 없는 API)
    if (!requiredRoles) {
      return true;
    }

    // JwtAuthGuard가 넣어준 user 꺼내기
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // user의 role이 필요한 role에 포함되는지 확인
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('관리자만 접근할 수 있습니다.');
    }
    return true;
  }
}
