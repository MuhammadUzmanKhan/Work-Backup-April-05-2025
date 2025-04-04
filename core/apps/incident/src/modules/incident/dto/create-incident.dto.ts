import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import {
  PriorityFilterBothConventionString,
  SourceType,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';

import { DepartmentStaffDto, ImageDto } from '.';

export class LocationDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber()
  longitude!: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber()
  latitude!: number;
}

export class CreateIncidentDto extends EventIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_zone_id!: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_division_ids!: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_type_id!: number;

  @IsOptional()
  @IsString()
  incident_type!: string;

  @IsOptional()
  @IsEnum(SourceType)
  source_type!: SourceType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  source_id!: number;

  @IsString()
  description!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location_attributes!: LocationDto;

  @IsEnum(PriorityFilterBothConventionString)
  priority!: PriorityFilterBothConventionString;

  @IsEnum(StatusFilter)
  status!: StatusFilter;

  @IsOptional()
  @IsString()
  locator_code!: string;

  @IsOptional()
  @IsString()
  row!: string;

  @IsOptional()
  @IsString()
  seat!: string;

  @IsOptional()
  @IsString()
  section!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => ImageDto)
  images!: ImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => DepartmentStaffDto)
  department_staff!: DepartmentStaffDto[];
}
