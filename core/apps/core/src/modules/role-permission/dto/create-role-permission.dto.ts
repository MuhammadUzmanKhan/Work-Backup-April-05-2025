import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PermissionType } from '@Common/constants';

export class CreateRoleDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  description: string;
}

export class CreatePermissionDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsEnum(PermissionType)
  type: PermissionType;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  description: string;
}
