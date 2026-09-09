import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ReviewDto {
  @IsIn(['APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status!: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

  @IsOptional()
  @IsString()
  @Length(3, 1000)
  reason?: string;
}
