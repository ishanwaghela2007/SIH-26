import { IsOptional, IsString, Length } from 'class-validator';

export class SkillDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  proficiency?: string;
}
