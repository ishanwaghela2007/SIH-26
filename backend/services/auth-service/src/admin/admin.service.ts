import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { OutboxService } from '../events/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, RequestContext } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly auth: AuthService,
    private readonly outbox: OutboxService,
  ) {}

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    preferredLanguage: string;
    status: string;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listUsers(query: ListUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search.trim().toLowerCase() } },
              { name: { contains: query.search.trim() } },
            ],
          }
        : {}),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: users.map((user) => this.publicUser(user)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(
    actorId: string,
    userId: string,
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED',
    context?: RequestContext,
  ) {
    if (actorId === userId)
      throw new BadRequestException('ADMIN_CANNOT_CHANGE_OWN_STATUS');
    const target = await this.users.findById(userId).catch(() => null);
    if (!target) throw new NotFoundException('USER_NOT_FOUND');
    if (target.status === status) return { user: this.publicUser(target) };

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status },
      });
      await tx.auditEvent.create({
        data: {
          type:
            status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_STATUS_CHANGED',
          userId,
          ip: context?.ip,
          userAgent: context?.userAgent,
          metadata: { actorId, from: target.status, to: status },
        },
      });
      await this.outbox.enqueue(
        'auth.user.status_changed',
        { userId, actorId, from: target.status, to: status },
        userId,
        tx,
      );
      return updated;
    });
    if (status === 'SUSPENDED')
      await this.auth.revokeAllSessions(userId, 'ADMIN_SUSPENSION', context);
    return { user: this.publicUser(user) };
  }

  async updateRole(
    actorId: string,
    userId: string,
    role: 'CUSTOMER' | 'WORKER' | 'ADMIN',
    context?: RequestContext,
  ) {
    if (actorId === userId)
      throw new BadRequestException('ADMIN_CANNOT_CHANGE_OWN_ROLE');
    const target = await this.users.findById(userId).catch(() => null);
    if (!target) throw new NotFoundException('USER_NOT_FOUND');
    if (target.role === role) return { user: this.publicUser(target) };

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { role },
        });
        await tx.auditEvent.create({
          data: {
            type: 'USER_ROLE_CHANGED',
            userId,
            ip: context?.ip,
            userAgent: context?.userAgent,
            metadata: { actorId, from: target.role, to: role },
          },
        });
        await this.outbox.enqueue(
          'auth.user.role_changed',
          { userId, actorId, from: target.role, to: role },
          userId,
          tx,
        );
        return updated;
      });
      await this.auth.revokeAllSessions(userId, 'ADMIN_ROLE_CHANGE', context);
      return { user: this.publicUser(user) };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw error;
    }
  }

  async revokeSessions(
    actorId: string,
    userId: string,
    context?: RequestContext,
  ) {
    await this.users.findById(userId);
    await this.auth.revokeAllSessions(userId, 'ADMIN_REVOKE', context);
    return { success: true, userId, actorId };
  }
}
