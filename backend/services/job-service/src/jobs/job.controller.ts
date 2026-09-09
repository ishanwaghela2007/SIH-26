import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { MatchQueryDto } from './dto/match-query.dto';
import { StatusDto } from './dto/status.dto';
import { JobService } from './job.service';

type UserRequest = Request & { user: { userId: string; role: string } };

@Controller('jobs')
@UseGuards(AuthGuard, RolesGuard)
export class JobController {
  constructor(private readonly jobs: JobService) {}

  @Post()
  @Roles('CUSTOMER')
  create(@Body() dto: CreateJobDto, @Req() req: UserRequest) {
    return this.jobs.create(req.user.userId, dto);
  }

  @Get('mine')
  mine(@Req() req: UserRequest) {
    return this.jobs.mine(req.user.userId);
  }

  @Get('matches')
  @Roles('WORKER')
  matches(@Query() query: MatchQueryDto) {
    return this.jobs.matches(query);
  }

  @Post(':jobId/accept')
  @Roles('WORKER')
  accept(@Param('jobId') jobId: string, @Req() req: UserRequest) {
    return this.jobs.accept(jobId, req.user.userId);
  }

  @Get(':jobId')
  getOne(@Param('jobId') jobId: string, @Req() req: UserRequest) {
    return this.jobs.getOne(jobId, req.user.userId);
  }

  @Patch(':jobId/status')
  changeStatus(
    @Param('jobId') jobId: string,
    @Body() dto: StatusDto,
    @Req() req: UserRequest,
  ) {
    return this.jobs.changeStatus(jobId, req.user.userId, req.user.role, dto);
  }
}
