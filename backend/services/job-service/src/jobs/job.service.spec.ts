import { ConflictException } from '@nestjs/common';
import { JobService } from './job.service';

describe('JobService', () => {
  const prisma = {
    job: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    jobAssignment: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const events = { publish: jest.fn() };
  const service = new JobService(prisma as never, events as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a second claimant after the conditional update loses the race', async () => {
    const tx = {
      job: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
      jobAssignment: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (value: typeof tx) => unknown) => callback(tx),
    );

    await expect(service.accept('job-1', 'worker-2')).rejects.toEqual(
      new ConflictException('JOB_ALREADY_ASSIGNED'),
    );
    expect(tx.jobAssignment.create).not.toHaveBeenCalled();
  });

  it('scores an exact district match above a domain-only match', async () => {
    prisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1',
        serviceDomain: 'plumbing',
        district: 'central',
        language: 'en',
      },
      {
        id: 'job-2',
        serviceDomain: 'plumbing',
        district: 'north',
        language: 'en',
      },
    ]);

    const result = await service.matches({
      domain: 'plumbing',
      district: 'central',
    });

    expect(result.map((entry) => entry.job.id)).toEqual(['job-1', 'job-2']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });
});
