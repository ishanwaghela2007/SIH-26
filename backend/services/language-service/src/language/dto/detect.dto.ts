import { IsString, Length } from 'class-validator';

export class DetectLanguageDto {
  @IsString()
  @Length(1, 10_000)
  text!: string;
}
