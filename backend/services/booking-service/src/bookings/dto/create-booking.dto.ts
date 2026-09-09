import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @Length(10, 80)
  jobId!: string;

  @IsInt()
  @Min(1)
  @Max(100000000)
  amountMinor!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency = 'INR';
}
