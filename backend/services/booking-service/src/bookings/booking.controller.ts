import {
  Body,
  Controller,
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
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentIntentDto } from './dto/payment-intent.dto';
import { BookingStatusDto } from './dto/status.dto';
import { BookingService } from './booking.service';

type UserRequest = Request & { user: { userId: string; role: string } };

@Controller('bookings')
@UseGuards(AuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post()
  @Roles('CUSTOMER')
  create(@Body() dto: CreateBookingDto, @Req() req: UserRequest) {
    const token = req.get('authorization')?.slice(7).trim() ?? '';
    return this.bookings.create(req.user.userId, token, dto);
  }

  @Get('mine')
  mine(@Req() req: UserRequest) {
    return this.bookings.listMine(req.user.userId);
  }

  @Get(':bookingId')
  getOne(@Param('bookingId') bookingId: string, @Req() req: UserRequest) {
    return this.bookings.getOne(req.user.userId, bookingId);
  }

  @Post(':bookingId/payment-intent')
  @Roles('CUSTOMER')
  paymentIntent(
    @Param('bookingId') bookingId: string,
    @Body() dto: PaymentIntentDto,
    @Req() req: UserRequest,
  ) {
    return this.bookings.createPaymentIntent(req.user.userId, bookingId, dto);
  }

  @Patch(':bookingId/status')
  status(
    @Param('bookingId') bookingId: string,
    @Body() dto: BookingStatusDto,
    @Req() req: UserRequest,
  ) {
    return this.bookings.updateStatus(
      req.user.userId,
      bookingId,
      req.user.role,
      dto,
    );
  }
}
