import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

type Response = {
  valid: boolean;
  user_id: string;
  email: string;
  role: string;
};
type Client = {
  validateToken(data: { access_token: string }): Observable<Response>;
};

@Injectable()
export class AuthClientService implements OnModuleInit {
  private auth?: Client;
  constructor(@Inject('AUTH_PACKAGE') private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.auth = this.client.getService<Client>('AuthService');
  }
  validateToken(accessToken: string) {
    if (!this.auth) throw new Error('AUTH_CLIENT_NOT_READY');
    return firstValueFrom(
      this.auth.validateToken({ access_token: accessToken }),
    );
  }
}
