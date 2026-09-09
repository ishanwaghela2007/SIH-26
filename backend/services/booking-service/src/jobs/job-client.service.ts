import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Job = {
  id: string;
  customerId: string;
  assignedWorkerId: string | null;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
};

@Injectable()
export class JobClientService {
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config
      .getOrThrow<string>('JOB_SERVICE_URL')
      .replace(/\/$/, '');
  }

  async getJob(jobId: string, accessToken: string): Promise<Job> {
    const response = await fetch(
      `${this.baseUrl}/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: { authorization: `Bearer ${accessToken}` },
      },
    );
    if (response.status === 404) throw new NotFoundException('JOB_NOT_FOUND');
    if (!response.ok) throw new BadRequestException('JOB_SERVICE_UNAVAILABLE');
    return (await response.json()) as Job;
  }
}
