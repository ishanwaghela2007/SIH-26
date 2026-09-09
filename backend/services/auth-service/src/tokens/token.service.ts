import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, randomBytes, randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { RedisService } from '../security/redis.service';
import { getNumber } from '../config/config';

export type AccessClaims = {
  sub: string;
  email: string;
  role: string;
  jti: string;
  type: 'access';
  iat?: number;
  exp?: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private get privateKey() {
    return this.config.get<string>('JWT_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  }

  private get publicKey() {
    return this.config.get<string>('JWT_PUBLIC_KEY')?.replace(/\\n/g, '\n');
  }

  private get usesAsymmetricSigning() {
    return Boolean(this.privateKey && this.publicKey);
  }

  private get accessSecret() {
    return (
      this.config.get<string>('JWT_ACCESS_SECRET') ??
      this.config.get<string>('JWT_SECRET')
    );
  }

  private signingOptions(): JwtSignOptions {
    const expiresIn = (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m') as JwtSignOptions['expiresIn'];
    if (this.privateKey && this.publicKey) {
      return {
        privateKey: this.privateKey,
        algorithm: 'RS256' as const,
        expiresIn,
      };
    }
    const secret = this.accessSecret;
    if (!secret) {
      throw new Error(
        'JWT_ACCESS_SECRET or JWT_PRIVATE_KEY/JWT_PUBLIC_KEY is required',
      );
    }
    return { secret, algorithm: 'HS256' as const, expiresIn };
  }

  async issueAccessToken(user: { id: string; email: string; role: string }) {
    const payload: Omit<AccessClaims, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
      type: 'access',
    };
    return this.jwt.signAsync(payload, this.signingOptions());
  }

  async verifyAccessToken(token: string): Promise<AccessClaims> {
    try {
      const options: JwtVerifyOptions = this.usesAsymmetricSigning
        ? { publicKey: this.publicKey, algorithms: ['RS256'] }
        : { secret: this.accessSecret, algorithms: ['HS256'] };
      const claims = await this.jwt.verifyAsync<AccessClaims>(token, options);
      if (
        claims.type !== 'access' ||
        (await this.isAccessJtiRevoked(claims.jti))
      ) {
        throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
      }
      return claims;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    }
  }

  createOpaqueToken() {
    return `${randomUUID()}.${randomBytes(32).toString('base64url')}`;
  }

  parseOpaqueToken(token: string) {
    const [selector, secret, ...remainder] = token.split('.');
    if (!selector || !secret || remainder.length) return null;
    return { selector, secret };
  }

  hashOpaqueSecret(secret: string) {
    return argon2.hash(secret, {
      type: argon2.argon2id,
      memoryCost: getNumber(this.config, 'ARGON2_MEMORY_COST', 19456),
      timeCost: getNumber(this.config, 'ARGON2_TIME_COST', 2),
      parallelism: getNumber(this.config, 'ARGON2_PARALLELISM', 1),
    });
  }

  verifyOpaqueSecret(hash: string, secret: string) {
    return argon2.verify(hash, secret).catch(() => false);
  }

  encryptForEvent(secret: string) {
    const configured = this.config.get<string>('AUTH_EVENT_ENCRYPTION_KEY');
    if (!configured) return undefined;
    const key = Buffer.from(configured, 'base64');
    if (key.length !== 32) {
      throw new Error('AUTH_EVENT_ENCRYPTION_KEY must be 32-byte base64');
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    return `v1.${iv.toString('base64url')}.${cipher
      .getAuthTag()
      .toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  async revokeAccessJti(jti: string, expiresAtEpochSeconds: number) {
    const seconds = Math.max(
      1,
      expiresAtEpochSeconds - Math.floor(Date.now() / 1000),
    );
    await this.redis.set(`auth:revoked-jti:${jti}`, '1', seconds);
  }

  async isAccessJtiRevoked(jti: string) {
    return (await this.redis.get(`auth:revoked-jti:${jti}`)) !== null;
  }
}
