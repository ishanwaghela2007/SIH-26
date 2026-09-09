import { Module } from '@nestjs/common';
import { JobClientService } from './job-client.service';

@Module({ providers: [JobClientService], exports: [JobClientService] })
export class JobClientModule {}
