import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisService } from './redis.service';
import { getNumber } from '../config/config';

export class RateLimitedException extends HttpException {
  constructor() {
    super('RATE_LIMITED', 429);
  }
}

@Injectable()
export class RateLimitService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private key(scope: string, subject: string) {
    return `auth:rate:${scope}:${createHash('sha256').update(subject).digest('hex')}`;
  }

  async check(
    scope: string,
    subject: string,
    limit?: number,
    windowSeconds?: number,
  ) {
    const configuredLimit =
      limit ?? getNumber(this.config, 'AUTH_RATE_LIMIT_MAX', 20);
    const configuredWindow =
      windowSeconds ??
      getNumber(this.config, 'AUTH_RATE_LIMIT_WINDOW_SECONDS', 900);
    const count = await this.redis.increment(
      this.key(scope, subject),
      configuredWindow,
    );
    if (count > configuredLimit) throw new RateLimitedException();
  }

  async recordLoginFailure(email: string, ip: string) {
    const windowSeconds = getNumber(
      this.config,
      'LOGIN_ATTEMPT_WINDOW_SECONDS',
      900,
    );
    const max = getNumber(this.config, 'LOGIN_ATTEMPT_MAX', 5);
    const count = await this.redis.increment(
      this.key('login-failure', `${email}:${ip}`),
      windowSeconds,
    );
    if (count >= max)
      await this.redis.set(
        this.key('login-block', `${email}:${ip}`),
        '1',
        windowSeconds,
      );
  }

  async ensureLoginAllowed(email: string, ip: string) {
    if (await this.redis.get(this.key('login-block', `${email}:${ip}`))) {
      throw new RateLimitedException();
    }
  }

  async clearLoginFailures(email: string, ip: string) {
    await this.redis.del(this.key('login-failure', `${email}:${ip}`));
    await this.redis.del(this.key('login-block', `${email}:${ip}`));
  }
}
