import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @Length(2, 3000)
  description: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  @Length(2, 3000)
  description: string;
}
