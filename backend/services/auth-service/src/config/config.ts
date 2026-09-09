import { ConfigService } from '@nestjs/config';

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function getNumber(
  config: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = config.get<string | number>(key);
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = stringValue(environment.NODE_ENV) || 'development';
  const databaseUrl = stringValue(environment.DATABASE_URL).trim();
  const accessSecret = stringValue(
    environment.JWT_ACCESS_SECRET ?? environment.JWT_SECRET,
  ).trim();
  const privateKey = stringValue(environment.JWT_PRIVATE_KEY).trim();
  const publicKey = stringValue(environment.JWT_PUBLIC_KEY).trim();

  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!accessSecret && !(privateKey && publicKey)) {
    throw new Error(
      'Configure JWT_ACCESS_SECRET or both JWT_PRIVATE_KEY and JWT_PUBLIC_KEY',
    );
  }

  if (nodeEnv === 'production') {
    for (const key of [
      'REDIS_URL',
      'KAFKA_BROKERS',
      'AUTH_EVENT_ENCRYPTION_KEY',
    ]) {
      if (!stringValue(environment[key]).trim()) {
        throw new Error(`${key} is required in production`);
      }
    }
  }

  return environment;
}
