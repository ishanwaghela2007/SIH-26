import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Redis-backed security storage. The memory fallback is limited to local test/dev. */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly memory = new Map<
    string,
    { value: string; expiresAt: number }
  >();
  private readonly client?: Redis;
  private readonly fallbackAllowed: boolean;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    this.fallbackAllowed = config.get<string>('NODE_ENV') !== 'production';
    if (url) {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.client.on('error', (error) =>
        this.logger.warn(`Redis unavailable: ${error.message}`),
      );
      void this.client.connect().catch(() => undefined);
    } else if (config.get<string>('NODE_ENV') === 'production') {
      throw new Error('REDIS_URL is required in production');
    }
  }

  private cleanup(key: string) {
    const item = this.memory.get(key);
    if (item && item.expiresAt <= Date.now()) this.memory.delete(key);
  }

  async get(key: string) {
    if (this.client?.status === 'ready') return this.client.get(key);
    if (this.client && !this.fallbackAllowed)
      throw new Error('REDIS_UNAVAILABLE');
    this.cleanup(key);
    return this.memory.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    if (this.client?.status === 'ready') {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    if (this.client && !this.fallbackAllowed)
      throw new Error('REDIS_UNAVAILABLE');
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async increment(key: string, ttlSeconds: number) {
    if (this.client?.status === 'ready') {
      const result = await this.client.eval(
        'local count = redis.call("INCR", KEYS[1]); if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]); end; return count;',
        1,
        key,
        ttlSeconds,
      );
      return Number(result);
    }
    if (this.client && !this.fallbackAllowed)
      throw new Error('REDIS_UNAVAILABLE');
    this.cleanup(key);
    const next = Number(this.memory.get(key)?.value ?? 0) + 1;
    this.memory.set(key, {
      value: String(next),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return next;
  }

  async del(key: string) {
    if (this.client?.status === 'ready') return this.client.del(key);
    if (this.client && !this.fallbackAllowed)
      throw new Error('REDIS_UNAVAILABLE');
    this.memory.delete(key);
    return 1;
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
