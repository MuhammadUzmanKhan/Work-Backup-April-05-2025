import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';
import { TranslationLanguages } from '@ontrack-tech-group/common/constants';

export class CreateNewIncidentTypeAndVariationDto extends CompanyIdDto {
  @Type(() => String)
  @IsString()
  core_incident_type_name: string;

  @Type(() => String)
  @IsOptional()
  @IsString()
  color: string;

  @Type(() => Variations)
  @IsArray()
  @ValidateNested({ each: true })
  variations: Variations[];
}

class Variations {
  @Type(() => Number)
  @IsNumber()
  sub_company_id: number;

  @Type(() => String)
  @IsString()
  default_lang: keyof typeof TranslationLanguages;

  @Type(() => String)
  @IsString()
  variation_name: string;
}
