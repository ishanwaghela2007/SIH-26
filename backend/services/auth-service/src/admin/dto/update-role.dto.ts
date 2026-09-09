import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['CUSTOMER', 'WORKER', 'ADMIN'])
  role!: 'CUSTOMER' | 'WORKER' | 'ADMIN';
}
