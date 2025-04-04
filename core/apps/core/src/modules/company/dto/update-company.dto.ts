import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { LanguageEnum } from '@ontrack-tech-group/common/constants';
import { CompanyCategoryType } from '@Common/constants';

export class LegalContactDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  number: string;
}

export class SecondaryContactDto extends LegalContactDto {}

export class UpdateCompanyDto {
  @IsString()
  @Length(3, 50)
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  logo: string;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  about: string;

  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  location: string;

  @IsString()
  @IsOptional()
  timezone: string;

  @IsString()
  @IsOptional()
  contact_name: string;

  @IsString()
  @IsOptional()
  contact_phone: string;

  @IsEmail()
  @IsOptional()
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
  @IsOptional()
  country: string;

  @IsNumber()
  @IsOptional()
  parent_id: number;

  @IsOptional()
  @IsEnum(LanguageEnum)
  default_lang: LanguageEnum;

  @IsOptional()
  @IsEnum(CompanyCategoryType)
  category: CompanyCategoryType;

  @IsNumber()
  @IsOptional()
  region_id: number;

  @IsBoolean()
  @IsOptional()
  demo_company: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => SecondaryContactDto)
  secondary_contacts: SecondaryContactDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => LegalContactDto)
  legal_contacts: LegalContactDto[];
}
