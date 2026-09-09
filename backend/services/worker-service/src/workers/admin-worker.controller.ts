import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentReviewDto } from './dto/document-review.dto';
import { ReviewDto } from './dto/review.dto';
import { WorkerService } from './worker.service';

type AdminRequest = Request & { user: { userId: string } };

@Controller('admin/workers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminWorkerController {
  constructor(private readonly workers: WorkerService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.workers.listForAdmin(status);
  }

  @Patch(':workerId/review')
  review(
    @Param('workerId') workerId: string,
    @Body() dto: ReviewDto,
    @Req() req: AdminRequest,
  ) {
    return this.workers.review(req.user.userId, workerId, dto);
  }

  @Patch(':workerId/documents/:documentId/review')
  reviewDocument(
    @Param('workerId') workerId: string,
    @Param('documentId') documentId: string,
    @Body() dto: DocumentReviewDto,
    @Req() req: AdminRequest,
  ) {
    return this.workers.reviewDocument(
      req.user.userId,
      workerId,
      documentId,
      dto,
    );
  }
}
