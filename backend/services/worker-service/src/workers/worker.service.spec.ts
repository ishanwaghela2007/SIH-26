import { BadRequestException } from '@nestjs/common';
import { WorkerService } from './worker.service';

describe('WorkerService', () => {
  const prisma = {
    workerProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    workerSkill: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    workerDocument: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const events = { publish: jest.fn() };
  const service = new WorkerService(prisma as never, events as never);

  beforeEach(() => jest.clearAllMocks());

  it('requires a domain, skill, and document before submission', async () => {
    prisma.workerProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      status: 'DRAFT',
      serviceDomains: [],
      skills: [],
      documents: [],
    });

    await expect(service.submit('worker-1')).rejects.toEqual(
      new BadRequestException('ONBOARDING_REQUIRES_DOMAIN_AND_SKILL'),
    );
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });

  it('does not approve a worker while a document is pending', async () => {
    prisma.workerProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      documents: [{ status: 'PENDING' }],
    });

    await expect(
      service.review('admin-1', 'worker-1', { status: 'APPROVED' }),
    ).rejects.toEqual(
      new BadRequestException('ALL_DOCUMENTS_MUST_BE_APPROVED'),
    );
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });

  it('publishes a submission event after a valid submission', async () => {
    prisma.workerProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      status: 'DRAFT',
      serviceDomains: ['plumbing'],
      skills: [{ name: 'pipe repair' }],
      documents: [{ status: 'PENDING' }],
    });
    prisma.workerProfile.update.mockResolvedValue({
      id: 'profile-1',
      status: 'SUBMITTED',
    });

    await service.submit('worker-1');

    expect(events.publish).toHaveBeenCalledWith(
      'worker.onboarding.submitted',
      { workerId: 'worker-1', profileId: 'profile-1' },
      'worker-1',
    );
  });
});
