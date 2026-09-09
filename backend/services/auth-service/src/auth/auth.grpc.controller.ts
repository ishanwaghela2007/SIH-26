import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthGrpcController {
  constructor(private readonly auth: AuthService) {}

  private user(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    preferredLanguage: string;
    status: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferred_language: user.preferredLanguage,
      status: user.status,
    };
  }

  private error(error: unknown): never {
    throw new RpcException((error as Error).message || 'AUTHENTICATION_FAILED');
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(data: { user_id: string }) {
    try {
      return this.user(await this.auth.getUser(data.user_id));
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'GetUserRole')
  async getUserRole(data: { user_id: string }) {
    try {
      const user = await this.auth.getUser(data.user_id);
      return { user_id: user.id, role: user.role };
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: {
    email: string;
    password: string;
    ip?: string;
    user_agent?: string;
  }) {
    try {
      const result = await this.auth.login(
        { email: data.email, password: data.password },
        { ip: data.ip, userAgent: data.user_agent },
      );
      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: this.user(result.user),
      };
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'GoogleLogin')
  async googleLogin(data: {
    id_token: string;
    ip?: string;
    user_agent?: string;
  }) {
    try {
      const result = await this.auth.googleLogin(data.id_token, {
        ip: data.ip,
        userAgent: data.user_agent,
      });
      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: this.user(result.user),
      };
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: {
    refresh_token: string;
    ip?: string;
    user_agent?: string;
  }) {
    try {
      const result = await this.auth.refresh(data.refresh_token, {
        ip: data.ip,
        userAgent: data.user_agent,
      });
      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: this.user(result.user),
      };
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'RevokeToken')
  async revokeToken(data: {
    user_id: string;
    refresh_token?: string;
    reason?: string;
  }) {
    try {
      if (data.refresh_token)
        await this.auth.logout(data.user_id, data.refresh_token);
      else
        await this.auth.revokeAllSessions(
          data.user_id,
          data.reason || 'INTERNAL_REVOKE',
        );
      return { success: true, message: 'Token revoked' };
    } catch (error) {
      this.error(error);
    }
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: { access_token: string }) {
    try {
      const { claims } = await this.auth.validateAccessToken(data.access_token);
      return {
        valid: true,
        user_id: claims.sub,
        email: claims.email,
        role: claims.role,
      };
    } catch {
      return { valid: false, user_id: '', email: '', role: '' };
    }
  }
}
