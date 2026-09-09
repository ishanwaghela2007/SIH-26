import { ConfigService } from '@nestjs/config';

export function validateEnvironment(environment: Record<string, unknown>) {
  if (!String(environment.DATABASE_URL ?? '').trim())
    throw new Error('DATABASE_URL is required');
  if (!String(environment.AUTH_GRPC_URL ?? '').trim())
    throw new Error('AUTH_GRPC_URL is required');
  return environment;
}

export function numberConfig(
  config: ConfigService,
  key: string,
  fallback: number,
) {
  const value = Number(config.get<string | number>(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
