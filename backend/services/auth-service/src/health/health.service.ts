import { Injectable } from '@nestjs/common';

import { OutboxService } from '../events/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../security/redis.service';

type DependencyStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly outbox: OutboxService,
  ) {}

  live() {
    return { status: 'ok', service: 'auth-service', timestamp: new Date() };
  }

  async readiness() {
    const checks: Record<string, DependencyStatus> = {
      postgres: 'down',
      redis: 'down',
      kafka: 'down',
    };

    const [postgres, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.redis.ping(),
    ]);
    checks.postgres = postgres ? 'up' : 'down';
    checks.redis = redis ? 'up' : 'down';
    checks.kafka = this.outbox.isReady() ? 'up' : 'down';

    const ready = Object.values(checks).every((status) => status === 'up');
    return {
      status: ready ? 'ok' : 'not_ready',
      ready,
      service: 'auth-service',
      checks,
      timestamp: new Date(),
    };
  }
}
