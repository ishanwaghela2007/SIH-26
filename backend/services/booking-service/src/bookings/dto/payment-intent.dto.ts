import { IsString, Length } from 'class-validator';

export class PaymentIntentDto {
  @IsString()
  @Length(8, 180)
  idempotencyKey!: string;
}
