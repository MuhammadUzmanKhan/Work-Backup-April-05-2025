import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { UploadIncidentMainZoneRecordDto } from '../dto';

export class UploadIncidentSubZoneRecordDto extends UploadIncidentMainZoneRecordDto {
  @IsNumber()
  parent_id: number;
}

export class UploadIncidentSubZoneDto extends EventIdQueryDto {
  @IsArray()
  incident_sub_zones: UploadIncidentSubZoneRecordDto[];

  @IsOptional()
  @IsUrl()
  url: string;

  @ValidateIf((o) => !!o.url)
  @IsString()
  file_name: string;
}
