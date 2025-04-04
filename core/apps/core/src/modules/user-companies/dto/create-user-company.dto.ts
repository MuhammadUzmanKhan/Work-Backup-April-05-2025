import {
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateIf,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RolesNumberEnum } from '@ontrack-tech-group/common/constants';
import { REQUEST_EVENT_TYPE } from '@Common/constants';

export class CreateUserCompanyDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  role_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;

  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  user_category: REQUEST_EVENT_TYPE;

  @ValidateIf(
    (o) =>
      o.role_id === RolesNumberEnum.REGIONAL_MANAGER ||
      o.role_id === RolesNumberEnum.GLOBAL_MANAGER,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  region_ids: number[];
}
