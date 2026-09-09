import { IsString, Length } from 'class-validator';

export class DocumentDto {
  @IsString()
  @Length(2, 80)
  type!: string;

  @IsString()
  @Length(8, 500)
  storageKey!: string;
}
