import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['PENDING', 'ACTIVE', 'SUSPENDED'])
  status!: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}
