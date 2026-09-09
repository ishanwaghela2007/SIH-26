import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthClientService } from './auth-client.service';

type AuthenticatedRequest = Request & { user?: unknown };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (!accessToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    try {
      const user = await this.authClient.validateToken(accessToken);
      if (!user.userId || !user.role) {
        throw new UnauthorizedException('UNAUTHORIZED');
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
  }
}
