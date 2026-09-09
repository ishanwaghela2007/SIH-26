import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{2,10}(-[a-zA-Z]{2,10})?$/)
  preferredLanguage?: string;
}
