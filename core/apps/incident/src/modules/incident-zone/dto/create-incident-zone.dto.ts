import { IsNumber, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateIncidentZoneDto extends EventIdQueryDto {
  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsNumber()
  sequence: number;
}
