import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  live() {
    return this.health.live();
  }

  @Get('ready')
  async ready() {
    const result = await this.health.readiness();
    if (!result.ready) throw new ServiceUnavailableException(result);
    return result;
  }
}
