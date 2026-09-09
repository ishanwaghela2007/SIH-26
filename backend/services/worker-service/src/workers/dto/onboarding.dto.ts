import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class OnboardingDto {
  @IsOptional()
  @IsString()
  @Length(2, 2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  district?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  serviceDomains?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  languages?: string[];
}
