import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventService } from '../events/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentDto } from './dto/document.dto';
import { DocumentReviewDto } from './dto/document-review.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { ReviewDto } from './dto/review.dto';
import { SkillDto } from './dto/skill.dto';

@Injectable()
export class WorkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventService,
  ) {}

  private async findProfile(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { skills: true, documents: true },
    });
    if (!profile) throw new NotFoundException('WORKER_PROFILE_NOT_FOUND');
    return profile;
  }

  async getMine(userId: string) {
    return this.findProfile(userId);
  }

  async saveOnboarding(userId: string, dto: OnboardingDto) {
    const profile = await this.prisma.workerProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio?.trim(),
        district: dto.district?.trim(),
        serviceDomains: dto.serviceDomains ?? [],
        languages: dto.languages ?? [],
      },
      update: {
        ...(dto.bio !== undefined ? { bio: dto.bio.trim() } : {}),
        ...(dto.district !== undefined
          ? { district: dto.district.trim() }
          : {}),
        ...(dto.serviceDomains !== undefined
          ? { serviceDomains: dto.serviceDomains }
          : {}),
        ...(dto.languages !== undefined ? { languages: dto.languages } : {}),
      },
      include: { skills: true, documents: true },
    });
    return profile;
  }

  async addSkill(userId: string, dto: SkillDto) {
    const profile = await this.findProfile(userId).catch(async (error) => {
      if (error instanceof NotFoundException)
        return this.prisma.workerProfile.create({
          data: { userId, serviceDomains: [], languages: [] },
          include: { skills: true, documents: true },
        });
      throw error;
    });
    try {
      return await this.prisma.workerSkill.create({
        data: {
          workerId: profile.id,
          name: dto.name.trim(),
          proficiency: dto.proficiency?.trim(),
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('SKILL_ALREADY_EXISTS');
      throw error;
    }
  }

  async removeSkill(userId: string, skillId: string) {
    const profile = await this.findProfile(userId);
    const deleted = await this.prisma.workerSkill.deleteMany({
      where: { id: skillId, workerId: profile.id },
    });
    if (!deleted.count) throw new NotFoundException('SKILL_NOT_FOUND');
    return { success: true };
  }

  async addDocument(userId: string, dto: DocumentDto) {
    const profile = await this.findProfile(userId);
    if (profile.status === 'APPROVED')
      throw new BadRequestException('WORKER_ALREADY_APPROVED');
    return this.prisma.workerDocument.create({
      data: {
        workerId: profile.id,
        type: dto.type.trim(),
        storageKey: dto.storageKey.trim(),
      },
    });
  }

  async submit(userId: string) {
    const profile = await this.findProfile(userId);
    if (!profile.serviceDomains.length || !profile.skills.length)
      throw new BadRequestException('ONBOARDING_REQUIRES_DOMAIN_AND_SKILL');
    if (!profile.documents.length)
      throw new BadRequestException('ONBOARDING_REQUIRES_DOCUMENT');
    if (!['DRAFT', 'REJECTED'].includes(profile.status))
      throw new BadRequestException('ONBOARDING_CANNOT_BE_SUBMITTED');

    const updated = await this.prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });
    await this.events.publish(
      'worker.onboarding.submitted',
      { workerId: userId, profileId: profile.id },
      userId,
    );
    return updated;
  }

  async listForAdmin(status?: string) {
    return this.prisma.workerProfile.findMany({
      where: status ? { status: status as never } : undefined,
      include: { skills: true, documents: true },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async review(adminId: string, workerId: string, dto: ReviewDto) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
      include: { documents: true },
    });
    if (!profile) throw new NotFoundException('WORKER_PROFILE_NOT_FOUND');
    if (dto.status === 'REJECTED' && !dto.reason?.trim())
      throw new BadRequestException('REJECTION_REASON_REQUIRED');
    if (dto.status === 'APPROVED') {
      const pendingDocuments = profile.documents.some(
        (document) => document.status !== 'APPROVED',
      );
      if (pendingDocuments)
        throw new BadRequestException('ALL_DOCUMENTS_MUST_BE_APPROVED');
    }

    const updated = await this.prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        status: dto.status,
        verifiedAt: dto.status === 'APPROVED' ? new Date() : null,
        rejectionReason: dto.status === 'REJECTED' ? dto.reason?.trim() : null,
      },
    });
    await this.events.publish(
      'worker.onboarding.reviewed',
      {
        workerId,
        reviewerId: adminId,
        status: dto.status,
        reason: dto.reason?.trim(),
      },
      workerId,
    );
    return updated;
  }

  async reviewDocument(
    adminId: string,
    workerId: string,
    documentId: string,
    dto: DocumentReviewDto,
  ) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: workerId },
    });
    if (!profile) throw new NotFoundException('WORKER_PROFILE_NOT_FOUND');
    if (dto.status === 'REJECTED' && !dto.reason?.trim())
      throw new BadRequestException('REJECTION_REASON_REQUIRED');
    const document = await this.prisma.workerDocument.updateMany({
      where: { id: documentId, workerId: profile.id },
      data: {
        status: dto.status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.status === 'REJECTED' ? dto.reason?.trim() : null,
      },
    });
    if (!document.count)
      throw new NotFoundException('WORKER_DOCUMENT_NOT_FOUND');
    await this.events.publish(
      'worker.document.reviewed',
      { workerId, documentId, reviewerId: adminId, status: dto.status },
      workerId,
    );
    return { success: true };
  }
}
