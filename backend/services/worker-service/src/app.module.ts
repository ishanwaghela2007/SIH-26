import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config';
import { EventModule } from './events/event.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { WorkerModule } from './workers/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    EventModule,
    AuthModule,
    WorkerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
