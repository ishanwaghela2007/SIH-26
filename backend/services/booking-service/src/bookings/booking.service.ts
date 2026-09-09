import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { EventService } from '../events/event.service';
import { JobClientService } from '../jobs/job-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentIntentDto } from './dto/payment-intent.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { BookingStatusDto } from './dto/status.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobClientService,
    private readonly events: EventService,
    private readonly config: ConfigService,
  ) {}

  private readonly include = {
    payments: true,
    statusHistory: { orderBy: { createdAt: 'asc' as const } },
  };

  async create(customerId: string, accessToken: string, dto: CreateBookingDto) {
    const job = await this.jobs.getJob(dto.jobId, accessToken);
    if (job.customerId !== customerId)
      throw new ForbiddenException('FORBIDDEN');
    if (job.status !== 'ASSIGNED' || !job.assignedWorkerId)
      throw new BadRequestException('JOB_MUST_BE_ASSIGNED');
    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const created = await tx.booking.create({
          data: {
            jobId: job.id,
            customerId,
            workerId: job.assignedWorkerId!,
            amountMinor: dto.amountMinor,
            currency: dto.currency.toUpperCase(),
            scheduledStart: job.scheduledStart
              ? new Date(job.scheduledStart)
              : undefined,
            scheduledEnd: job.scheduledEnd
              ? new Date(job.scheduledEnd)
              : undefined,
          },
          include: this.include,
        });
        await tx.bookingStatusEvent.create({
          data: {
            bookingId: created.id,
            to: 'PENDING_PAYMENT',
            actorId: customerId,
          },
        });
        return created;
      });
      await this.events.publish(
        'booking.created',
        {
          bookingId: booking.id,
          jobId: job.id,
          customerId,
          workerId: job.assignedWorkerId,
        },
        booking.id,
      );
      return booking;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('BOOKING_ALREADY_EXISTS');
      throw error;
    }
  }

  async listMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { OR: [{ customerId: userId }, { workerId: userId }] },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.include,
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.customerId !== userId && booking.workerId !== userId)
      throw new NotFoundException('BOOKING_NOT_FOUND');
    return booking;
  }

  async createPaymentIntent(
    userId: string,
    bookingId: string,
    dto: PaymentIntentDto,
  ) {
    const booking = await this.getOne(userId, bookingId);
    if (booking.customerId !== userId)
      throw new ForbiddenException('FORBIDDEN');
    if (booking.status !== 'PENDING_PAYMENT')
      throw new BadRequestException('BOOKING_NOT_AWAITING_PAYMENT');
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) return existing;
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        idempotencyKey: dto.idempotencyKey,
        amountMinor: booking.amountMinor,
        currency: booking.currency,
      },
    });
    await this.events.publish(
      'payment.intent.created',
      {
        paymentId: payment.id,
        bookingId,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
      },
      payment.id,
    );
    return payment;
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    role: string,
    dto: BookingStatusDto,
  ) {
    const booking = await this.getOne(userId, bookingId);
    const isCustomer = booking.customerId === userId;
    const isWorker = booking.workerId === userId;
    if (dto.status === 'CANCELLED' && !isCustomer)
      throw new ForbiddenException('ONLY_CUSTOMER_CAN_CANCEL');
    if (['IN_PROGRESS', 'COMPLETED'].includes(dto.status) && !isWorker)
      throw new ForbiddenException('ONLY_WORKER_CAN_UPDATE');
    if (
      dto.status === 'DISPUTED' &&
      !isCustomer &&
      !isWorker &&
      role !== 'ADMIN'
    )
      throw new ForbiddenException('FORBIDDEN');
    if (dto.status === 'COMPLETED' && booking.status !== 'IN_PROGRESS')
      throw new BadRequestException('BOOKING_NOT_IN_PROGRESS');
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id: bookingId },
        data: { status: dto.status },
        include: this.include,
      });
      await tx.bookingStatusEvent.create({
        data: {
          bookingId,
          from: booking.status,
          to: dto.status,
          actorId: userId,
          reason: dto.reason?.trim(),
        },
      });
      return result;
    });
    await this.events.publish(
      'booking.status.changed',
      { bookingId, actorId: userId, status: dto.status },
      bookingId,
    );
    return updated;
  }

  async handlePaymentWebhook(
    signature: string | undefined,
    dto: PaymentWebhookDto,
  ) {
    this.verifySignature(signature, dto);
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('PAYMENT_NOT_FOUND');
    if (payment.status === 'SUCCEEDED' && dto.status !== 'SUCCEEDED')
      return payment;
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: dto.status, providerReference: dto.providerReference },
        include: { booking: true },
      });
      if (dto.status === 'SUCCEEDED')
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      return updated;
    });
    await this.events.publish(
      'payment.status.changed',
      {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        status: dto.status,
      },
      payment.id,
    );
    return result;
  }

  private verifySignature(
    signature: string | undefined,
    payload: PaymentWebhookDto,
  ) {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim();
    if (!secret)
      throw new UnauthorizedException('PAYMENT_WEBHOOK_NOT_CONFIGURED');
    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new UnauthorizedException('INVALID_PAYMENT_SIGNATURE');
  }
}
