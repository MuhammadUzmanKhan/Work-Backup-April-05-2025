import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { UserRole } from 'src/modules/users/enums/user-roles.enum';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsOptional()
  role?: UserRole;
}
