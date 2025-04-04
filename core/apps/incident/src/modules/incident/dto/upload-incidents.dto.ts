import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import {
  IncidentPriorityApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadIncidentRecordDto {
  @Type(() => Number)
  @IsNumber()
  incident_zone_id!: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_division_ids!: number[];

  @Type(() => Number)
  @IsNumber()
  incident_type_id!: number;

  @IsString()
  description!: string;

  @IsEnum(IncidentPriorityApi)
  priority!: IncidentPriorityApi;

  @IsEnum(StatusFilter)
  status!: StatusFilter;

  @IsOptional()
  @IsString()
  logged_date_time!: Date;
}

export class UploadIncidentDto extends EventIdQueryDto {
  @IsArray()
  incidents!: UploadIncidentRecordDto[];

  @IsOptional()
  @IsUrl()
  url!: string;

  @ValidateIf((o) => !!o.url)
  @IsString()
  file_name!: string;
}
