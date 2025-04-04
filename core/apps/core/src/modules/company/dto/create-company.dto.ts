import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CompanyCreateCategoryType } from '@Common/constants';
import { LegalContactDto, SecondaryContactDto } from './index';

export class CreateCompanyDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsOptional()
  @IsString()
  logo: string;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  about: string;

  @IsString()
  url: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  timezone: string;

  @IsString()
  contact_name: string;

  @IsString()
  contact_phone: string;

  @IsOptional()
  @IsEmail()
  contact_email: string;

  @IsBoolean()
  @IsOptional()
  use_pay_fabric_live: boolean;

  @IsString()
  @IsOptional()
  company_token: string;

  @IsBoolean()
  @IsOptional()
  active: boolean;

  @IsString()
  country: string;

  @IsOptional()
  @IsEnum(CompanyCreateCategoryType)
  category: CompanyCreateCategoryType;

  @IsNumber()
  region_id: number;

  @IsBoolean()
  @IsOptional()
  demo_company: boolean;

  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SecondaryContactDto)
  secondary_contacts: SecondaryContactDto[];

  @IsArray()
  @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LegalContactDto)
  legal_contacts: LegalContactDto[];
}
