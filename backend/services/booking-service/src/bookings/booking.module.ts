import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JobClientModule } from '../jobs/job-client.module';
import { BookingController } from './booking.controller';
import { PaymentController } from './payment.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AuthModule, JobClientModule],
  controllers: [BookingController, PaymentController],
  providers: [BookingService],
})
export class BookingModule {}
