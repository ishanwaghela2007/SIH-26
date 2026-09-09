import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

import { OutboxService } from '../events/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitService } from '../security/rate-limit.service';
import { TokenService } from '../tokens/token.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '../generated/prisma/client';
import { getNumber } from '../config/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type RequestContext = { ip?: string; userAgent?: string };
type PrismaExecutor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuthService {
  private readonly google: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly rateLimit: RateLimitService,
    private readonly outbox: OutboxService,
    private readonly config: ConfigService,
  ) {
    this.google = new OAuth2Client(config.get<string>('GOOGLE_CLIENT_ID'));
  }

  private async audit(
    type: string,
    userId?: string,
    context?: RequestContext,
    metadata?: object,
    tx: PrismaExecutor = this.prisma,
  ) {
    await tx.auditEvent.create({
      data: {
        type,
        userId,
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata,
      },
    });
  }

  private refreshExpiry() {
    const configured =
      this.config.get<string>('REFRESH_TOKEN_EXPIRES_IN') ??
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN');
    const duration = configured
      ? this.parseDuration(configured, 7 * 86_400_000)
      : getNumber(this.config, 'REFRESH_TOKEN_EXPIRES_DAYS', 7) * 86_400_000;
    return new Date(Date.now() + duration);
  }

  private oneTimeExpiry(
    name:
      'EMAIL_VERIFICATION_EXPIRES_MINUTES' | 'PASSWORD_RESET_EXPIRES_MINUTES',
  ) {
    return new Date(
      Date.now() +
        getNumber(this.config, name, name.startsWith('EMAIL') ? 1440 : 30) *
          60_000,
    );
  }

  private parseDuration(value: string, fallback: number) {
    const match = value.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
    if (!match) return fallback;
    const amount = Number(match[1]);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return amount * (multipliers[match[2].toLowerCase()] ?? 1);
  }

  private assertCanAuthenticate(user: { status: string }) {
    if (user.status === 'SUSPENDED')
      throw new ForbiddenException('ACCOUNT_SUSPENDED');
    if (user.status === 'PENDING')
      throw new ForbiddenException('ACCOUNT_PENDING_VERIFICATION');
  }

  private async verifyPassword(hash: string, password: string) {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    preferredLanguage: string;
    status: string;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  private async createSession(
    user: { id: string; email: string; role: string },
    familyId: string = randomUUID(),
    tx: PrismaExecutor = this.prisma,
  ) {
    const raw = this.tokens.createOpaqueToken();
    const parsed = this.tokens.parseOpaqueToken(raw)!;
    const row = await tx.refreshToken.create({
      data: {
        userId: user.id,
        selector: parsed.selector,
        familyId,
        tokenHash: await this.tokens.hashOpaqueSecret(parsed.secret),
        expiresAt: this.refreshExpiry(),
      },
    });
    return {
      accessToken: await this.tokens.issueAccessToken(user),
      refreshToken: raw,
      refreshRow: row,
    };
  }

  async register(dto: RegisterDto, context?: RequestContext) {
    if (!dto.name.trim()) throw new BadRequestException('INVALID_NAME');
    const email = this.users.normalizeEmail(dto.email);
    await this.rateLimit.check(
      'register',
      context?.ip ?? email,
      getNumber(this.config, 'REGISTER_RATE_LIMIT_MAX', 10),
    );
    const hash = await argon2.hash(dto.password, { type: argon2.argon2id });
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const exists = await tx.user.findUnique({ where: { email } });
        if (exists) throw new ConflictException('ACCOUNT_EXISTS_USE_LOGIN');
        const created = await tx.user.create({
          data: {
            email,
            name: dto.name.trim(),
            passwordHash: hash,
            role: 'CUSTOMER',
            status: 'PENDING',
            identities: { create: { provider: 'LOCAL', providerId: email } },
          },
        });
        await this.audit('USER_REGISTERED', created.id, context, undefined, tx);
        await this.issueVerificationToken(created.id, tx);
        await this.outbox.enqueue(
          'auth.user.created',
          { userId: created.id, email: created.email, role: created.role },
          created.id,
          tx,
        );
        return created;
      });
      return {
        user: this.publicUser(user),
        message: 'Verification email requested',
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('ACCOUNT_EXISTS_USE_LOGIN');
      }
      throw error;
    }
  }

  async login(dto: LoginDto, context?: RequestContext) {
    const email = this.users.normalizeEmail(dto.email);
    const ip = context?.ip ?? 'unknown';
    await this.rateLimit.check(
      'login',
      `${email}:${ip}`,
      getNumber(this.config, 'LOGIN_RATE_LIMIT_MAX', 10),
    );
    await this.rateLimit.ensureLoginAllowed(email, ip);
    const user = await this.users.findByEmail(email);
    const valid =
      !!user?.passwordHash &&
      (await this.verifyPassword(user.passwordHash, dto.password));
    if (!user || !valid) {
      await this.rateLimit.recordLoginFailure(email, ip);
      await this.audit('LOGIN_FAILED', user?.id, context, { method: 'LOCAL' });
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    this.assertCanAuthenticate(user);
    await this.rateLimit.clearLoginFailures(email, ip);
    const result = await this.prisma.$transaction(async (tx) => {
      const session = await this.createSession(user, undefined, tx);
      await this.audit(
        'USER_LOGGED_IN',
        user.id,
        context,
        { method: 'LOCAL' },
        tx,
      );
      await this.outbox.enqueue(
        'auth.user.logged_in',
        { userId: user.id, method: 'LOCAL' },
        user.id,
        tx,
      );
      return session;
    });
    return {
      user: this.publicUser(user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  async refresh(rawRefreshToken: string, context?: RequestContext) {
    await this.rateLimit.check(
      'refresh',
      context?.ip ?? 'unknown',
      getNumber(this.config, 'REFRESH_RATE_LIMIT_MAX', 30),
    );
    const parsed = this.tokens.parseOpaqueToken(rawRefreshToken);
    if (!parsed) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const current = await tx.refreshToken.findUnique({
        where: { selector: parsed.selector },
        include: { user: true },
      });
      if (
        !current ||
        !(await this.tokens.verifyOpaqueSecret(
          current.tokenHash,
          parsed.secret,
        ))
      ) {
        throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
      }
      if (current.status !== 'ACTIVE') {
        await tx.refreshToken.updateMany({
          where: { familyId: current.familyId, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date() },
        });
        await this.audit(
          'REFRESH_TOKEN_REUSE_DETECTED',
          current.userId,
          context,
          { familyId: current.familyId },
          tx,
        );
        await this.outbox.enqueue(
          'auth.refresh.reuse_detected',
          { userId: current.userId, familyId: current.familyId },
          current.userId,
          tx,
        );
        throw new UnauthorizedException('REFRESH_TOKEN_REUSE_DETECTED');
      }
      if (current.expiresAt <= now)
        throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
      this.assertCanAuthenticate(current.user);
      const replacementRaw = this.tokens.createOpaqueToken();
      const replacementParsed = this.tokens.parseOpaqueToken(replacementRaw)!;
      const replacementId = randomUUID();
      const updated = await tx.refreshToken.updateMany({
        where: { id: current.id, status: 'ACTIVE', expiresAt: { gt: now } },
        data: {
          status: 'ROTATED',
          rotatedAt: now,
          replacedById: replacementId,
        },
      });
      if (updated.count !== 1) {
        await tx.refreshToken.updateMany({
          where: { familyId: current.familyId, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date() },
        });
        await this.audit(
          'REFRESH_TOKEN_REUSE_DETECTED',
          current.userId,
          context,
          { familyId: current.familyId },
          tx,
        );
        await this.outbox.enqueue(
          'auth.refresh.reuse_detected',
          { userId: current.userId, familyId: current.familyId },
          current.userId,
          tx,
        );
        throw new UnauthorizedException('REFRESH_TOKEN_REUSE_DETECTED');
      }
      await tx.refreshToken.create({
        data: {
          id: replacementId,
          userId: current.userId,
          selector: replacementParsed.selector,
          familyId: current.familyId,
          tokenHash: await this.tokens.hashOpaqueSecret(
            replacementParsed.secret,
          ),
          expiresAt: this.refreshExpiry(),
        },
      });
      const accessToken = await this.tokens.issueAccessToken(current.user);
      await this.audit(
        'REFRESH_TOKEN_ROTATED',
        current.userId,
        context,
        { familyId: current.familyId },
        tx,
      );
      return {
        user: this.publicUser(current.user),
        accessToken,
        refreshToken: replacementRaw,
      };
    });
  }

  async logout(
    userId: string,
    rawRefreshToken?: string,
    accessClaims?: { jti: string; exp?: number },
    context?: RequestContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const selector = rawRefreshToken
        ? this.tokens.parseOpaqueToken(rawRefreshToken)?.selector
        : undefined;
      if (selector)
        await tx.refreshToken.updateMany({
          where: { userId, selector, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date() },
        });
      await this.audit('USER_LOGGED_OUT', userId, context, undefined, tx);
      await this.outbox.enqueue(
        'auth.token.revoked',
        { userId, reason: 'LOGOUT' },
        userId,
        tx,
      );
    });
    if (accessClaims?.exp)
      await this.tokens.revokeAccessJti(accessClaims.jti, accessClaims.exp);
    return { message: 'Logged out' };
  }

  async revokeAllSessions(
    userId: string,
    reason: string,
    context?: RequestContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      await this.audit(
        'REFRESH_TOKEN_REVOKED',
        userId,
        context,
        { reason },
        tx,
      );
      await this.outbox.enqueue(
        'auth.token.revoked',
        { userId, reason },
        userId,
        tx,
      );
    });
  }

  private async issueVerificationToken(
    userId: string,
    tx: PrismaExecutor = this.prisma,
  ) {
    await tx.emailVerificationToken.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
    const raw = this.tokens.createOpaqueToken();
    const parsed = this.tokens.parseOpaqueToken(raw)!;
    const row = await tx.emailVerificationToken.create({
      data: {
        userId,
        selector: parsed.selector,
        tokenHash: await this.tokens.hashOpaqueSecret(parsed.secret),
        expiresAt: this.oneTimeExpiry('EMAIL_VERIFICATION_EXPIRES_MINUTES'),
      },
    });
    const tokenEnvelope = this.tokens.encryptForEvent(raw);
    await this.outbox.enqueue(
      'email.verification.requested',
      {
        userId,
        selector: row.selector,
        expiresAt: row.expiresAt.toISOString(),
        ...(tokenEnvelope ? { tokenEnvelope } : {}),
      },
      userId,
      tx,
    );
    return raw;
  }

  async resendVerification(email: string, context?: RequestContext) {
    const normalized = this.users.normalizeEmail(email);
    await this.rateLimit.check(
      'email-resend',
      `${normalized}:${context?.ip ?? 'unknown'}`,
      getNumber(this.config, 'EMAIL_RESEND_RATE_LIMIT_MAX', 5),
    );
    const user = await this.users.findByEmail(normalized);
    if (user && !user.emailVerifiedAt)
      await this.prisma.$transaction((tx) =>
        this.issueVerificationToken(user.id, tx),
      );
    return {
      message:
        'If the account requires verification, an email has been requested.',
    };
  }

  async verifyEmail(rawToken: string, context?: RequestContext) {
    await this.rateLimit.check(
      'email-verify',
      context?.ip ?? 'unknown',
      getNumber(this.config, 'EMAIL_VERIFY_RATE_LIMIT_MAX', 10),
    );
    const parsed = this.tokens.parseOpaqueToken(rawToken);
    if (!parsed) throw new UnauthorizedException('INVALID_VERIFICATION_TOKEN');
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.emailVerificationToken.findUnique({
        where: { selector: parsed.selector },
        include: { user: true },
      });
      if (
        !token ||
        token.status !== 'ACTIVE' ||
        !(await this.tokens.verifyOpaqueSecret(token.tokenHash, parsed.secret))
      )
        throw new UnauthorizedException('INVALID_VERIFICATION_TOKEN');
      if (token.expiresAt <= new Date())
        throw new UnauthorizedException('VERIFICATION_TOKEN_EXPIRED');
      const used = await tx.emailVerificationToken.updateMany({
        where: { id: token.id, status: 'ACTIVE' },
        data: { status: 'USED', usedAt: new Date() },
      });
      if (!used.count)
        throw new UnauthorizedException('INVALID_VERIFICATION_TOKEN');
      const user = await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      });
      await this.audit('EMAIL_VERIFIED', user.id, context, undefined, tx);
      await this.outbox.enqueue(
        'auth.email.verified',
        { userId: user.id },
        user.id,
        tx,
      );
      return { user: this.publicUser(user), message: 'Email verified' };
    });
  }

  async forgotPassword(email: string, context?: RequestContext) {
    const normalized = this.users.normalizeEmail(email);
    await this.rateLimit.check(
      'password-forgot',
      `${normalized}:${context?.ip ?? 'unknown'}`,
      getNumber(this.config, 'PASSWORD_FORGOT_RATE_LIMIT_MAX', 5),
    );
    const user = await this.users.findByEmail(normalized);
    if (user?.passwordHash && user.status !== 'SUSPENDED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, status: 'ACTIVE' },
          data: { status: 'REVOKED' },
        });
        const raw = this.tokens.createOpaqueToken();
        const parsed = this.tokens.parseOpaqueToken(raw)!;
        const token = await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            selector: parsed.selector,
            tokenHash: await this.tokens.hashOpaqueSecret(parsed.secret),
            expiresAt: this.oneTimeExpiry('PASSWORD_RESET_EXPIRES_MINUTES'),
          },
        });
        const tokenEnvelope = this.tokens.encryptForEvent(raw);
        await this.audit(
          'PASSWORD_RESET_REQUESTED',
          user.id,
          context,
          undefined,
          tx,
        );
        await this.outbox.enqueue(
          'email.password_reset.requested',
          {
            userId: user.id,
            selector: token.selector,
            expiresAt: token.expiresAt.toISOString(),
            ...(tokenEnvelope ? { tokenEnvelope } : {}),
          },
          user.id,
          tx,
        );
      });
    }
    return {
      message:
        'If an account exists, password reset instructions have been requested.',
    };
  }

  async resetPassword(
    rawToken: string,
    password: string,
    context?: RequestContext,
  ) {
    await this.rateLimit.check(
      'password-reset',
      context?.ip ?? 'unknown',
      getNumber(this.config, 'PASSWORD_RESET_RATE_LIMIT_MAX', 10),
    );
    const parsed = this.tokens.parseOpaqueToken(rawToken);
    if (!parsed)
      throw new UnauthorizedException('INVALID_PASSWORD_RESET_TOKEN');
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { selector: parsed.selector },
        include: { user: true },
      });
      if (
        !token ||
        token.status !== 'ACTIVE' ||
        !(await this.tokens.verifyOpaqueSecret(token.tokenHash, parsed.secret))
      )
        throw new UnauthorizedException('INVALID_PASSWORD_RESET_TOKEN');
      if (token.expiresAt <= new Date())
        throw new UnauthorizedException('PASSWORD_RESET_TOKEN_EXPIRED');
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, status: 'ACTIVE' },
        data: { status: 'USED', usedAt: new Date() },
      });
      if (!consumed.count)
        throw new UnauthorizedException('INVALID_PASSWORD_RESET_TOKEN');
      await tx.user.update({
        where: { id: token.userId },
        data: {
          passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        },
      });
      await tx.refreshToken.updateMany({
        where: { userId: token.userId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      await this.audit(
        'PASSWORD_RESET_COMPLETED',
        token.userId,
        context,
        undefined,
        tx,
      );
      await this.outbox.enqueue(
        'auth.password.reset',
        { userId: token.userId },
        token.userId,
        tx,
      );
      return { message: 'Password reset completed' };
    });
  }

  private async googleIdentity(idToken: string) {
    const audience = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!audience) throw new UnauthorizedException('GOOGLE_NOT_CONFIGURED');
    const ticket = await this.google
      .verifyIdToken({ idToken, audience })
      .catch(() => {
        throw new UnauthorizedException('INVALID_GOOGLE_TOKEN');
      });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true)
      throw new UnauthorizedException('GOOGLE_ACCOUNT_NOT_VERIFIED');
    return {
      providerId: payload.sub,
      email: this.users.normalizeEmail(payload.email),
      name: payload.name?.trim() || payload.email,
    };
  }

  async googleLogin(idToken: string, context?: RequestContext) {
    await this.rateLimit.check(
      'google-login',
      context?.ip ?? 'unknown',
      getNumber(this.config, 'GOOGLE_RATE_LIMIT_MAX', 10),
    );
    const identity = await this.googleIdentity(idToken);
    const result = await this.prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.authIdentity.findUnique({
        where: {
          provider_providerId: {
            provider: 'GOOGLE',
            providerId: identity.providerId,
          },
        },
        include: { user: true },
      });
      let user = existingIdentity?.user;
      if (!user) {
        const sameEmail = await tx.user.findUnique({
          where: { email: identity.email },
        });
        if (sameEmail) throw new ConflictException('ACCOUNT_EXISTS_USE_LOGIN');
        user = await tx.user.create({
          data: {
            email: identity.email,
            name: identity.name,
            role: 'CUSTOMER',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
            identities: {
              create: { provider: 'GOOGLE', providerId: identity.providerId },
            },
          },
        });
        await this.outbox.enqueue(
          'auth.user.created',
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            provider: 'GOOGLE',
          },
          user.id,
          tx,
        );
      }
      this.assertCanAuthenticate(user);
      const session = await this.createSession(user, undefined, tx);
      await this.audit('GOOGLE_LOGIN', user.id, context, undefined, tx);
      await this.outbox.enqueue(
        'auth.user.logged_in',
        { userId: user.id, method: 'GOOGLE' },
        user.id,
        tx,
      );
      return { user, session };
    });
    return {
      user: this.publicUser(result.user),
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken,
    };
  }

  async linkGoogle(userId: string, idToken: string, context?: RequestContext) {
    await this.rateLimit.check(
      'google-link',
      `${userId}:${context?.ip ?? 'unknown'}`,
      getNumber(this.config, 'GOOGLE_RATE_LIMIT_MAX', 10),
    );
    const identity = await this.googleIdentity(idToken);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.authIdentity.findUnique({
        where: {
          provider_providerId: {
            provider: 'GOOGLE',
            providerId: identity.providerId,
          },
        },
      });
      if (existing)
        throw new ConflictException('GOOGLE_ACCOUNT_ALREADY_LINKED');
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
      this.assertCanAuthenticate(user);
      const sameEmail = await tx.user.findUnique({
        where: { email: identity.email },
      });
      if (sameEmail && sameEmail.id !== userId)
        throw new ConflictException('ACCOUNT_EXISTS_USE_LOGIN');
      await tx.authIdentity.create({
        data: { provider: 'GOOGLE', providerId: identity.providerId, userId },
      });
      await this.audit('GOOGLE_LINKED', userId, context, undefined, tx);
      await this.outbox.enqueue('auth.google.linked', { userId }, userId, tx);
      return { user: this.publicUser(user), message: 'Google account linked' };
    });
  }

  async validateAccessToken(token: string) {
    const claims = await this.tokens.verifyAccessToken(token);
    const user = await this.users.findById(claims.sub).catch(() => {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    });
    if (user.status !== 'ACTIVE')
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    return { claims, user };
  }

  async getUser(id: string) {
    return this.publicUser(await this.users.findById(id));
  }
}
