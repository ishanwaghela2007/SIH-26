import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly bookings: BookingService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Headers('x-payment-signature') signature: string | undefined,
    @Body() dto: PaymentWebhookDto,
  ) {
    return this.bookings.handlePaymentWebhook(signature, dto);
  }
}
