import { AdminBootstrapService } from './admin-bootstrap.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('admin-hash'),
  argon2id: 2,
}));

describe('AdminBootstrapService', () => {
  it('creates the configured admin once without overwriting an existing account', async () => {
    const tx = {
      user: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'admin-1', email: 'admin@example.com' }),
      },
      auditEvent: { create: jest.fn() },
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'admin-1' }),
      },
      $transaction: jest.fn(
        async (callback: (value: typeof tx) => Promise<void>) => callback(tx),
      ),
    };
    const config = {
      get: jest.fn(
        (key: string) =>
          (
            ({
              ADMIN_EMAIL: ' Admin@Example.com ',
              ADMIN_NAME: 'Platform Admin',
              ADMIN_PASSWORD: 'a-secure-admin-password',
            }) as Record<string, string>
          )[key],
      ),
    };
    const outbox = { enqueue: jest.fn() };
    const service = new AdminBootstrapService(
      prisma as never,
      config as never,
      outbox as never,
    );

    await service.onModuleInit();
    await service.onModuleInit();

    expect(tx.user.create).toHaveBeenCalledTimes(1);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN', status: 'ACTIVE' }),
      }),
    );
    expect(outbox.enqueue).toHaveBeenCalledWith(
      'auth.user.created',
      expect.objectContaining({ role: 'ADMIN' }),
      'admin-1',
      tx,
    );
  });
});
