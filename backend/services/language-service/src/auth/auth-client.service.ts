import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthClient, AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthClientService implements OnModuleInit {
  private authClient!: AuthClient;

  constructor(@Inject('AUTH_PACKAGE') private readonly grpcClient: ClientGrpc) {}

  onModuleInit(): void {
    this.authClient = this.grpcClient.getService<AuthClient>('AuthService');
  }

  async validateToken(accessToken: string): Promise<AuthenticatedUser> {
    const response = await firstValueFrom(
      this.authClient.validateToken({ accessToken }),
    );
    const userId = response.userId ?? response.user_id;
    if (!response.valid || !userId || !response.role) {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
    return {
      userId,
      email: response.email,
      role: response.role,
    };
  }
}
