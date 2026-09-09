import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventService } from '../events/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { MatchQueryDto } from './dto/match-query.dto';
import { StatusDto } from './dto/status.dto';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventService,
  ) {}

  private readonly include = { assignments: true } as const;

  async create(customerId: string, dto: CreateJobDto) {
    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMin > dto.budgetMax
    )
      throw new BadRequestException('INVALID_BUDGET_RANGE');
    if (
      dto.scheduledStart &&
      dto.scheduledEnd &&
      new Date(dto.scheduledStart) >= new Date(dto.scheduledEnd)
    )
      throw new BadRequestException('INVALID_SCHEDULE');
    const job = await this.prisma.job.create({
      data: {
        customerId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        serviceDomain: dto.serviceDomain.trim().toLowerCase(),
        district: dto.district.trim().toLowerCase(),
        language: dto.language?.trim().toLowerCase(),
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
      },
      include: this.include,
    });
    await this.events.publish(
      'job.created',
      { jobId: job.id, customerId },
      job.id,
    );
    return job;
  }

  async getOne(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: this.include,
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    if (job.customerId !== userId && job.assignedWorkerId !== userId)
      throw new NotFoundException('JOB_NOT_FOUND');
    return job;
  }

  async mine(userId: string) {
    return this.prisma.job.findMany({
      where: { OR: [{ customerId: userId }, { assignedWorkerId: userId }] },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async matches(query: MatchQueryDto) {
    const domain = query.domain.trim().toLowerCase();
    const district = query.district?.trim().toLowerCase();
    const language = query.language?.trim().toLowerCase();
    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        serviceDomain: domain,
        ...(district ? { district } : {}),
      },
      include: this.include,
      orderBy: { createdAt: 'asc' },
    });
    return jobs
      .map((job) => ({
        job,
        score:
          100 +
          (district && job.district === district ? 50 : 0) +
          (language && job.language === language ? 10 : 0),
      }))
      .sort((a, b) => b.score - a.score);
  }

  async accept(jobId: string, workerId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.job.updateMany({
        where: { id: jobId, status: 'OPEN', assignedWorkerId: null },
        data: { status: 'ASSIGNED', assignedWorkerId: workerId },
      });
      if (!claimed.count) throw new ConflictException('JOB_ALREADY_ASSIGNED');
      await tx.jobAssignment.create({ data: { jobId, workerId } });
      return tx.job.findUnique({ where: { id: jobId }, include: this.include });
    });
    if (!updated) throw new NotFoundException('JOB_NOT_FOUND');
    await this.events.publish('job.assigned', { jobId, workerId }, jobId);
    return updated;
  }

  async changeStatus(
    jobId: string,
    userId: string,
    role: string,
    dto: StatusDto,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: this.include,
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    const isCustomer = job.customerId === userId;
    const isWorker = job.assignedWorkerId === userId;
    if (!isCustomer && !isWorker) throw new NotFoundException('JOB_NOT_FOUND');
    if (dto.status === 'CANCELLED' && !isCustomer)
      throw new BadRequestException('ONLY_CUSTOMER_CAN_CANCEL_JOB');
    if (['IN_PROGRESS', 'COMPLETED'].includes(dto.status) && !isWorker)
      throw new BadRequestException('ONLY_ASSIGNED_WORKER_CAN_UPDATE_STATUS');
    if (
      dto.status === 'DISPUTED' &&
      role !== 'ADMIN' &&
      !isCustomer &&
      !isWorker
    )
      throw new BadRequestException('INVALID_STATUS_ACTOR');
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: dto.status },
      include: this.include,
    });
    await this.events.publish(
      'job.status_changed',
      { jobId, userId, status: dto.status },
      jobId,
    );
    return updated;
  }
}
