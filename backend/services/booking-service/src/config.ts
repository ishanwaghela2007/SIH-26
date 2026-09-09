import { ConfigService } from '@nestjs/config';

export function validateEnvironment(environment: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'AUTH_GRPC_URL', 'JOB_SERVICE_URL']) {
    if (!String(environment[key] ?? '').trim())
      throw new Error(`${key} is required`);
  }
  return environment;
}

export function requireConfig(config: ConfigService, key: string) {
  const value = config.get<string>(key)?.trim();
  if (!value && config.get<string>('NODE_ENV') === 'production')
    throw new Error(`${key} is required in production`);
  return value ?? '';
}
