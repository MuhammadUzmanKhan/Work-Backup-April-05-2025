import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadIncidentCameraZoneRecordDto {
  @IsString()
  name: string;

  @IsString()
  longitude: string;

  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  camera_type: string;

  @IsOptional()
  @IsNumber()
  device_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'The directions monitored should not be longer than 50 characters',
  })
  directions_monitored: string;
}

export class UploadIncidentCameraZoneDto extends EventIdQueryDto {
  @IsArray()
  camera_zones: UploadIncidentCameraZoneRecordDto[];

  @IsOptional()
  @IsUrl()
  url: string;

  @ValidateIf((o) => !!o.url)
  @IsString()
  file_name: string;
}
