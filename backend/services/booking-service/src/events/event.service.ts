import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventService.name);
  private readonly producer?: Producer;
  constructor(config: ConfigService) {
    const brokers = config.get<string>('KAFKA_BROKERS');
    if (brokers)
      this.producer = new Kafka({
        clientId: config.get('KAFKA_CLIENT_ID', 'booking-service'),
        brokers: brokers.split(','),
      }).producer();
  }
  async onModuleInit() {
    await this.producer
      ?.connect()
      .catch((error: Error) =>
        this.logger.warn(`Kafka unavailable: ${error.message}`),
      );
  }
  async publish(topic: string, payload: object, key?: string) {
    if (!this.producer) return;
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(payload) }],
      });
    } catch (error) {
      this.logger.warn(
        `Kafka event was not published: ${(error as Error).message}`,
      );
    }
  }
  async onModuleDestroy() {
    await this.producer?.disconnect();
  }
}
