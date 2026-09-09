import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentDto } from './dto/document.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { SkillDto } from './dto/skill.dto';
import { WorkerService } from './worker.service';

type WorkerRequest = Request & { user: { userId: string } };

@Controller('workers/me')
@UseGuards(AuthGuard, RolesGuard)
@Roles('WORKER')
export class WorkerController {
  constructor(private readonly workers: WorkerService) {}

  @Get()
  getMine(@Req() req: WorkerRequest) {
    return this.workers.getMine(req.user.userId);
  }

  @Post('onboarding')
  saveOnboarding(@Body() dto: OnboardingDto, @Req() req: WorkerRequest) {
    return this.workers.saveOnboarding(req.user.userId, dto);
  }

  @Patch('onboarding')
  updateOnboarding(@Body() dto: OnboardingDto, @Req() req: WorkerRequest) {
    return this.workers.saveOnboarding(req.user.userId, dto);
  }

  @Post('skills')
  addSkill(@Body() dto: SkillDto, @Req() req: WorkerRequest) {
    return this.workers.addSkill(req.user.userId, dto);
  }

  @Delete('skills/:skillId')
  removeSkill(@Param('skillId') skillId: string, @Req() req: WorkerRequest) {
    return this.workers.removeSkill(req.user.userId, skillId);
  }

  @Post('documents')
  addDocument(@Body() dto: DocumentDto, @Req() req: WorkerRequest) {
    return this.workers.addDocument(req.user.userId, dto);
  }

  @Post('submit')
  submit(@Req() req: WorkerRequest) {
    return this.workers.submit(req.user.userId);
  }
}
