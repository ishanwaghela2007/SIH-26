import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config';
import { EventModule } from './events/event.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { JobModule } from './jobs/job.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    EventModule,
    AuthModule,
    JobModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
