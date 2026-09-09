import { IsOptional, IsString, Length } from 'class-validator';

export class TranslateDto {
  @IsString()
  @Length(1, 10_000)
  text!: string;

  @IsString()
  @Length(2, 50)
  targetLanguage!: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  sourceLanguage?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1_000)
  context?: string;
}
