import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class DocumentReviewDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @Length(3, 1000)
  reason?: string;
}
