import {
  IsEmail,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';
import { ContactType } from '@ontrack-tech-group/common/constants';

export class UpdateCompanyContactDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsOptional()
  @IsString()
  number: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNumber()
  company_id: number;

  @IsOptional()
  @IsEnum(ContactType)
  type: ContactType;
}
