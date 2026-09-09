import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['CUSTOMER', 'WORKER', 'ADMIN'])
  role?: 'CUSTOMER' | 'WORKER' | 'ADMIN';

  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE', 'SUSPENDED'])
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
