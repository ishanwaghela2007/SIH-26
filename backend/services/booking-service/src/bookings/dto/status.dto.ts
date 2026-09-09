import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class BookingStatusDto {
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}
