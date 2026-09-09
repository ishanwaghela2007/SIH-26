import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

type PrismaExecutor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private readonly producer?: Producer;
  private timer?: NodeJS.Timeout;
  private publishing = false;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const brokers = config.get<string>('KAFKA_BROKERS');
    if (brokers) {
      this.producer = new Kafka({
        clientId: config.get<string>('KAFKA_CLIENT_ID', 'auth-service'),
        brokers: brokers.split(','),
      }).producer();
    } else if (config.get<string>('NODE_ENV') === 'production') {
      throw new Error('KAFKA_BROKERS is required in production');
    }
  }

  async onModuleInit() {
    if (!this.producer) return;
    await this.producer
      .connect()
      .catch((error: Error) =>
        this.logger.warn(`Kafka unavailable: ${error.message}`),
      );
    this.timer = setInterval(() => void this.publishPending(), 5000);
    this.timer.unref();
  }

  async enqueue(
    topic: string,
    payload: object,
    key?: string,
    tx: PrismaExecutor = this.prisma,
  ) {
    await tx.outboxEvent.create({ data: { topic, key, payload } });
  }

  async publishPending() {
    if (!this.producer || this.publishing) return;
    this.publishing = true;
    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { publishedAt: null },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      for (const event of events) {
        try {
          await this.producer.send({
            topic: event.topic,
            messages: [
              {
                key: event.key ?? undefined,
                value: JSON.stringify(event.payload),
              },
            ],
          });
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { publishedAt: new Date(), attempts: { increment: 1 } },
          });
        } catch (error) {
          this.logger.warn(
            `Kafka event ${event.id} was not published: ${(error as Error).message}`,
          );
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { attempts: { increment: 1 } },
          });
          break;
        }
      }
    } finally {
      this.publishing = false;
    }
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.producer?.disconnect();
  }
}
