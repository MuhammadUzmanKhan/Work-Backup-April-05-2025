import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateIncidentCameraZoneDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsString()
  camera_type: string;

  @IsOptional()
  @IsString()
  directions_monitored: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  device_id: string;
}
