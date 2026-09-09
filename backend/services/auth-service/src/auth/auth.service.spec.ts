import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('argon2-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

type AnyRecord = Record<string, any>;

const user = (overrides: AnyRecord = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  passwordHash: 'argon2-hash',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  emailVerifiedAt: new Date(),
  preferredLanguage: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

function createHarness() {
  const state: AnyRecord = { refreshUpdateCount: 1 };
  const tx: AnyRecord = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue(user({ status: 'PENDING', emailVerifiedAt: null })),
      update: jest.fn().mockResolvedValue(user()),
    },
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        selector: 'selector-1',
        familyId: 'family-1',
        tokenHash: 'refresh-hash',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60_000),
        user: user(),
      }),
      updateMany: jest
        .fn()
        .mockImplementation(async () => ({ count: state.refreshUpdateCount })),
      create: jest.fn().mockResolvedValue({ id: 'refresh-2' }),
    },
    emailVerificationToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({
        selector: 'verification-selector',
        expiresAt: new Date(),
      }),
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({
        selector: 'reset-selector',
        expiresAt: new Date(),
      }),
      findUnique: jest.fn(),
    },
    authIdentity: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    auditEvent: { create: jest.fn() },
    outboxEvent: { create: jest.fn() },
  };

  const prisma = {
    ...tx,
    $transaction: jest.fn(
      async (callback: (transaction: AnyRecord) => Promise<unknown>) =>
        callback(tx),
    ),
  };
  const tokens = {
    createOpaqueToken: jest
      .fn()
      .mockReturnValueOnce('selector-1.secret-1')
      .mockReturnValueOnce('selector-2.secret-2')
      .mockReturnValue('selector-3.secret-3'),
    parseOpaqueToken: jest.fn((value: string) => {
      const [selector, secret] = value.split('.');
      return selector && secret ? { selector, secret } : null;
    }),
    hashOpaqueSecret: jest.fn().mockResolvedValue('opaque-hash'),
    verifyOpaqueSecret: jest.fn().mockResolvedValue(true),
    issueAccessToken: jest.fn().mockResolvedValue('access-token'),
    revokeAccessJti: jest.fn(),
    encryptForEvent: jest.fn().mockReturnValue(undefined),
  };
  const users = {
    normalizeEmail: (email: string) => email.trim().toLowerCase(),
    findByEmail: jest.fn().mockResolvedValue(user()),
    findById: jest.fn().mockResolvedValue(user()),
  };
  const rateLimit = {
    check: jest.fn(),
    ensureLoginAllowed: jest.fn(),
    recordLoginFailure: jest.fn(),
    clearLoginFailures: jest.fn(),
  };
  const outbox = { enqueue: jest.fn() };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: AnyRecord = {
        REFRESH_TOKEN_EXPIRES_IN: '7d',
        EMAIL_VERIFICATION_EXPIRES_MINUTES: 60,
        PASSWORD_RESET_EXPIRES_MINUTES: 30,
      };
      return values[key] ?? fallback;
    }),
  };

  return {
    service: new AuthService(
      prisma as never,
      users as never,
      tokens as never,
      rateLimit as never,
      outbox as never,
      config as never,
    ),
    prisma,
    tx,
    tokens,
    users,
    rateLimit,
    outbox,
    config,
    state,
  };
}

describe('AuthService security flows', () => {
  it('registers only a pending CUSTOMER and emits verification work', async () => {
    const harness = createHarness();
    const result = await harness.service.register(
      {
        email: ' User@Example.com ',
        name: ' Test User ',
        password: 'password-123',
      },
      { ip: '127.0.0.1' },
    );

    expect(harness.tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'CUSTOMER', status: 'PENDING' }),
      }),
    );
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.user.status).toBe('PENDING');
    expect(harness.outbox.enqueue).toHaveBeenCalledWith(
      'email.verification.requested',
      expect.any(Object),
      'user-1',
      harness.tx,
    );
  });

  it('rejects wrong and unknown local credentials without issuing a session', async () => {
    const harness = createHarness();
    const argon2 = await import('argon2');
    (argon2.verify as jest.Mock).mockResolvedValueOnce(false);
    await expect(
      harness.service.login({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toThrow('INVALID_CREDENTIALS');
    expect(harness.tokens.issueAccessToken).not.toHaveBeenCalled();

    harness.users.findByEmail.mockResolvedValueOnce(null);
    await expect(
      harness.service.login({
        email: 'missing@example.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('rotates a refresh token and revokes the family after a concurrent reuse', async () => {
    const harness = createHarness();
    const first = harness.service.refresh('selector-1.secret-1');
    let rotations = 0;
    harness.tx.refreshToken.updateMany.mockImplementation(
      async (args: AnyRecord) => {
        if (args.where.id) return { count: rotations++ === 0 ? 1 : 0 };
        return { count: 1 };
      },
    );
    const second = harness.service.refresh('selector-1.secret-1');

    await expect(first).resolves.toEqual(
      expect.objectContaining({ accessToken: 'access-token' }),
    );
    await expect(second).rejects.toThrow('REFRESH_TOKEN_REUSE_DETECTED');
    expect(harness.tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'family-1', status: 'ACTIVE' },
        data: expect.objectContaining({ status: 'REVOKED' }),
      }),
    );
    expect(harness.outbox.enqueue).toHaveBeenCalledWith(
      'auth.refresh.reuse_detected',
      expect.any(Object),
      'user-1',
      harness.tx,
    );
  });

  it('consumes a password reset token and revokes active refresh sessions', async () => {
    const harness = createHarness();
    harness.tx.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      selector: 'reset-selector',
      tokenHash: 'reset-hash',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      user: user(),
    });

    await expect(
      harness.service.resetPassword(
        'reset-selector.secret',
        'new-password-123',
      ),
    ).resolves.toEqual({ message: 'Password reset completed' });
    expect(harness.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
    expect(harness.tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', status: 'ACTIVE' },
        data: expect.objectContaining({ status: 'REVOKED' }),
      }),
    );
    expect(harness.outbox.enqueue).toHaveBeenCalledWith(
      'auth.password.reset',
      { userId: 'user-1' },
      'user-1',
      harness.tx,
    );
  });

  it('does not issue tokens for suspended users', async () => {
    const harness = createHarness();
    harness.users.findByEmail.mockResolvedValueOnce(
      user({ status: 'SUSPENDED' }),
    );
    await expect(
      harness.service.login({
        email: 'user@example.com',
        password: 'password-123',
      }),
    ).rejects.toThrow('ACCOUNT_SUSPENDED');
    expect(harness.tokens.issueAccessToken).not.toHaveBeenCalled();
  });

  it('creates a CUSTOMER for a verified Google identity without linking a local account', async () => {
    const harness = createHarness();
    (harness.service as any).googleIdentity = jest.fn().mockResolvedValue({
      providerId: 'google-1',
      email: 'google@example.com',
      name: 'Google User',
    });
    harness.tx.user.findUnique.mockResolvedValueOnce(null);
    harness.tx.user.create.mockResolvedValueOnce(
      user({ email: 'google@example.com', name: 'Google User' }),
    );

    const result = await harness.service.googleLogin('id-token');

    expect(result.user.role).toBe('CUSTOMER');
    expect(harness.tx.authIdentity.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_providerId: { provider: 'GOOGLE', providerId: 'google-1' },
        },
      }),
    );
  });

  it('rejects duplicate Google linking and expired one-time tokens', async () => {
    const harness = createHarness();
    (harness.service as any).googleIdentity = jest.fn().mockResolvedValue({
      providerId: 'google-1',
      email: 'google@example.com',
      name: 'Google User',
    });
    harness.tx.authIdentity.findUnique.mockResolvedValueOnce({
      userId: 'other-user',
    });
    await expect(
      harness.service.linkGoogle('user-1', 'id-token'),
    ).rejects.toThrow('GOOGLE_ACCOUNT_ALREADY_LINKED');

    harness.tx.emailVerificationToken.findUnique.mockResolvedValueOnce({
      id: 'verification-1',
      userId: 'user-1',
      status: 'ACTIVE',
      tokenHash: 'verification-hash',
      expiresAt: new Date(Date.now() - 1),
      user: user({ status: 'PENDING', emailVerifiedAt: null }),
    });
    await expect(
      harness.service.verifyEmail('verification-selector.secret'),
    ).rejects.toThrow('VERIFICATION_TOKEN_EXPIRED');

    harness.tx.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 'reset-1',
      userId: 'user-1',
      status: 'ACTIVE',
      tokenHash: 'reset-hash',
      expiresAt: new Date(Date.now() - 1),
      user: user(),
    });
    await expect(
      harness.service.resetPassword(
        'reset-selector.secret',
        'new-password-123',
      ),
    ).rejects.toThrow('PASSWORD_RESET_TOKEN_EXPIRED');
  });
});
