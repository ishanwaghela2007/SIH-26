import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        identities: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async createLocalUser(email: string, name: string, passwordHash: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException('Account already exists');
    }

    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        role: 'CUSTOMER',
        status: 'PENDING',
        identities: {
          create: {
            provider: 'LOCAL',
            providerId: normalizedEmail,
          },
        },
      },
    });
  }
}
