import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../events/outbox.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly outbox: OutboxService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const name = this.config.get<string>('ADMIN_NAME')?.trim();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email && !name && !password) return;
    if (!email || !name || !password)
      throw new Error(
        'ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD must be configured together',
      );
    if (password.length < 12)
      throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return;
    await this.prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          identities: { create: { provider: 'LOCAL', providerId: email } },
        },
      });
      await tx.auditEvent.create({
        data: { type: 'ADMIN_BOOTSTRAPPED', userId: admin.id },
      });
      await this.outbox.enqueue(
        'auth.user.created',
        {
          userId: admin.id,
          email: admin.email,
          role: 'ADMIN',
          source: 'BOOTSTRAP',
        },
        admin.id,
        tx,
      );
    });
    this.logger.log(`Bootstrapped configured admin account ${email}`);
  }
}
