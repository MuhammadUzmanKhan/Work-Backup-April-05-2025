import { IsOptional, IsString, IsObject, IsNumber } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateGlobalIncidentDto extends EventIdQueryDto {
  @IsNumber()
  incident_type_id: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  extra_info: Record<string, any>;

  @IsOptional()
  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  image_url: string;
}
