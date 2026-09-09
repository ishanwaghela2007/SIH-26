import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AdminWorkerController } from './admin-worker.controller';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkerController, AdminWorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
