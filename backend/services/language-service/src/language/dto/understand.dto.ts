import { IsOptional, IsString, Length } from 'class-validator';

export class UnderstandDto {
  @IsString()
  @Length(1, 10_000)
  text!: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  language?: string;
}
