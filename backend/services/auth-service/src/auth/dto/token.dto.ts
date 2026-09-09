import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class PasswordResetDto extends TokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class EmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
