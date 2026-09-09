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

import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

type AdminRequest = Request & { user: { userId: string } };

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: AdminRequest,
  ) {
    return this.admin.updateStatus(
      req.user.userId,
      userId,
      dto.status,
      this.context(req),
    );
  }

  @Patch('users/:userId/role')
  updateRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: AdminRequest,
  ) {
    return this.admin.updateRole(
      req.user.userId,
      userId,
      dto.role,
      this.context(req),
    );
  }

  @Post('users/:userId/revoke-sessions')
  revokeSessions(@Param('userId') userId: string, @Req() req: AdminRequest) {
    return this.admin.revokeSessions(
      req.user.userId,
      userId,
      this.context(req),
    );
  }

  private context(req: Request) {
    return { ip: req.ip, userAgent: req.get('user-agent') };
  }
}
