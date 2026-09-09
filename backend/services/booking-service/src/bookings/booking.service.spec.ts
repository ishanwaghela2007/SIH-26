import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  const prisma = {
    booking: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    payment: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const jobs = { getJob: jest.fn() };
  const events = { publish: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'PAYMENT_WEBHOOK_SECRET' ? 'test-secret' : undefined,
    ),
  };
  const service = new BookingService(
    prisma as never,
    jobs as never,
    events as never,
    config as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects payment webhooks with an invalid signature', async () => {
    await expect(
      service.handlePaymentWebhook('invalid', {
        paymentId: 'payment-1',
        status: 'SUCCEEDED',
      }),
    ).rejects.toEqual(new UnauthorizedException('INVALID_PAYMENT_SIGNATURE'));
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a correctly signed payment webhook', async () => {
    const body = { paymentId: 'payment-1', status: 'SUCCEEDED' as const };
    const signature = createHmac('sha256', 'test-secret')
      .update(JSON.stringify(body))
      .digest('hex');
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'PROCESSING',
      bookingId: 'booking-1',
      booking: { id: 'booking-1' },
    });
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          payment: {
            update: jest
              .fn()
              .mockResolvedValue({ id: 'payment-1', status: 'SUCCEEDED' }),
          },
          booking: { update: jest.fn() },
        }),
    );

    await service.handlePaymentWebhook(signature, body);

    expect(events.publish).toHaveBeenCalledWith(
      'payment.status.changed',
      { paymentId: 'payment-1', bookingId: 'booking-1', status: 'SUCCEEDED' },
      'payment-1',
    );
  });

  it('returns an existing payment for the same idempotency key', async () => {
    const existing = { id: 'payment-1', status: 'REQUIRES_ACTION' };
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      customerId: 'customer-1',
      status: 'PENDING_PAYMENT',
      amountMinor: 5000,
      currency: 'INR',
      payments: [],
      statusHistory: [],
    });
    prisma.payment.findUnique.mockResolvedValue(existing);

    await expect(
      service.createPaymentIntent('customer-1', 'booking-1', {
        idempotencyKey: 'idem-123456',
      }),
    ).resolves.toBe(existing);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
