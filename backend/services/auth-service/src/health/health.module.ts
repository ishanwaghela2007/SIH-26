import { Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [PrismaModule, SecurityModule, EventsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
