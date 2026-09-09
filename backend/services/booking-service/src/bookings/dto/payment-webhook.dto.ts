import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  @Length(8, 80)
  paymentId!: string;

  @IsIn(['PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'])
  status!: 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

  @IsOptional()
  @IsString()
  @Length(2, 200)
  providerReference?: string;
}
