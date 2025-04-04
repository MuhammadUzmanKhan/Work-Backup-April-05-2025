import {
  IsEmail,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';
import { ContactType } from '@ontrack-tech-group/common/constants';

export class CreateCompanyContactDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsNumber()
  company_id: number;

  @IsEnum(ContactType)
  type: ContactType;
}
