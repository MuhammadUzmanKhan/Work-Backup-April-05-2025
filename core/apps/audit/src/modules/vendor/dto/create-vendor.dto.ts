import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class CreateVendorDto extends CompanyIdDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  first_name!: string;

  @IsNotEmpty()
  @IsString()
  last_name!: string;

  @IsNotEmpty()
  @IsString()
  cell!: string;

  @IsNotEmpty()
  @IsString()
  country_code!: string;

  @IsNotEmpty()
  @IsString()
  country_iso_code!: string;

  @IsEmail()
  contact_email!: string;

  @IsOptional()
  @IsString()
  color!: string;

  @IsOptional()
  @IsString()
  note!: string;
}
