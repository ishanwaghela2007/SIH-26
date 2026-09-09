import { IsOptional, IsString, Length } from 'class-validator';

export class MatchQueryDto {
  @IsString()
  @Length(2, 100)
  domain!: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  district?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  language?: string;
}
