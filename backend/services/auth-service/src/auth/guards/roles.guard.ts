import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

type AuthenticatedRequest = Request & {
  user?: { userId?: string };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;
    if (!userId) throw new ForbiddenException('FORBIDDEN');

    const user = await this.users.findById(userId).catch(() => null);
    if (!user || user.status !== 'ACTIVE' || !requiredRoles.includes(user.role))
      throw new ForbiddenException('FORBIDDEN');

    request.user = { ...request.user, userId: user.id };
    return true;
  }
}
