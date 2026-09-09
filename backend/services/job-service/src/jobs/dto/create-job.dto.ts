import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @Length(3, 160)
  title!: string;

  @IsString()
  @Length(10, 5000)
  description!: string;

  @IsString()
  @Length(2, 100)
  serviceDomain!: string;

  @IsString()
  @Length(2, 120)
  district!: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  language?: string;

  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  budgetMax?: number;
}
