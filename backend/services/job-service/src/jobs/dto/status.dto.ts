import { IsIn } from 'class-validator';

export class StatusDto {
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
}
