import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, JwtGuard, RolesGuard],
})
export class AdminModule {}
