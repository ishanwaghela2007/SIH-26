import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthClientService } from './auth-client.service';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthClientService) {}
  async canActivate(context: ExecutionContext) {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    try {
      const result = await this.auth.validateToken(token);
      if (!result.valid || !result.user_id || !result.role)
        throw new Error('INVALID');
      req.user = {
        userId: result.user_id,
        email: result.email,
        role: result.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    }
  }
}
