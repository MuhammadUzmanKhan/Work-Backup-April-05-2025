import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadIncidentMainZoneRecordDto {
  @IsString()
  name: string;

  @IsString()
  longitude: string;

  @IsString()
  latitude: string;
}

export class UploadIncidentMainZoneDto extends EventIdQueryDto {
  @IsArray()
  incident_main_zones: UploadIncidentMainZoneRecordDto[];

  @IsOptional()
  @IsUrl()
  url: string;

  @ValidateIf((o) => !!o.url)
  @IsString()
  file_name: string;
}
