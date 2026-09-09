import { RateLimitService, RateLimitedException } from './rate-limit.service';

describe('RateLimitService', () => {
  it('returns a distributed 429 once the configured limit is exceeded', async () => {
    const redis = { increment: jest.fn().mockResolvedValue(6) };
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'AUTH_RATE_LIMIT_WINDOW_SECONDS' ? 900 : fallback,
      ),
    };
    const service = new RateLimitService(redis as never, config as never);

    await expect(service.check('login', 'email:ip', 5)).rejects.toBeInstanceOf(
      RateLimitedException,
    );
  });
});
