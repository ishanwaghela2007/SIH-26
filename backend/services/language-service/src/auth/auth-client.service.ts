import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_PACKAGE } from './auth.module';
import { AuthClient, AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthClientService implements OnModuleInit {
  private authClient!: AuthClient;

  constructor(@Inject(AUTH_PACKAGE) private readonly grpcClient: ClientGrpc) {}

  onModuleInit(): void {
    this.authClient = this.grpcClient.getService<AuthClient>('AuthService');
  }

  async validateToken(accessToken: string): Promise<AuthenticatedUser> {
    const response = await firstValueFrom(
      this.authClient.validateToken({ access_token: accessToken }),
    );
    if (!response.valid || !response.user_id || !response.role) {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
    return {
      userId: response.user_id,
      email: response.email,
      role: response.role,
    };
  }
}
