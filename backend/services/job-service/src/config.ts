export function validateEnvironment(environment: Record<string, unknown>) {
  if (!String(environment.DATABASE_URL ?? '').trim())
    throw new Error('DATABASE_URL is required');
  if (!String(environment.AUTH_GRPC_URL ?? '').trim())
    throw new Error('AUTH_GRPC_URL is required');
  return environment;
}
