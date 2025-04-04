import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class CreateTypeVariationDto extends CompanyIdDto {
  @IsString()
  @IsOptional()
  core_name: string;

  @IsString()
  variant_name: string;

  @Type(() => Number)
  @IsNumber()
  sub_company_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  core_incident_type_id: number;

  @IsOptional()
  @IsString()
  color: string;

  @IsString()
  language: string;
}
