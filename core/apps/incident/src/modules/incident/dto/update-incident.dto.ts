import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PriorityFilterBothConventionString,
  ResolvedIncidentNoteStatusApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

import { LocationDto } from './';

export class ImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  capture_at!: string;
}

export class UpdateIncidentDto extends EventIdQueryDto {
  @IsOptional()
  @IsEnum(PriorityFilterBothConventionString)
  priority!: PriorityFilterBothConventionString;

  @IsOptional()
  @IsEnum(StatusFilter)
  status!: StatusFilter;

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
  @Type(() => Number)
  @IsNumber()
  incident_zone_id!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  source_id!: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location_attributes!: LocationDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description!: string;

  @IsOptional()
  @IsString()
  locator_code!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reporter_id!: number;

  @IsOptional()
  @IsString()
  logged_date_time!: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  affected_person!: number;

  @IsOptional()
  @IsString()
  note!: string;

  @IsOptional()
  @IsEnum(ResolvedIncidentNoteStatusApi)
  resolved_status!: ResolvedIncidentNoteStatusApi;

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
}

export class UpdateIncidentLegalStatusDto extends EventIdQueryDto {
  @IsBoolean()
  is_legal!: boolean;
}
