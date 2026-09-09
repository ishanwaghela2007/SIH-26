import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './security/security.module';
import { EventsModule } from './events/events.module';
import { validateEnvironment } from './config/config';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SecurityModule,
    EventsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
