import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TranslationLanguages } from '@ontrack-tech-group/common/constants';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class UpdateTypeVariationDto extends CompanyIdDto {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Color should not be empty' })
  color: string;

  @Type(() => String)
  @IsString()
  language: keyof typeof TranslationLanguages;

  @Type(() => Number)
  @IsNumber()
  incident_type_id: number;

  @Type(() => Number)
  @IsNumber()
  sub_company_id: number;

  @Type(() => Number)
  @IsNumber()
  core_incident_type_id: number;
}
