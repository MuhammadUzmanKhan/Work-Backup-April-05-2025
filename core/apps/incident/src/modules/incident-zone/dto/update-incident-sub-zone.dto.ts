import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { UpdateIncidentZoneDto } from '.';
import { Type } from 'class-transformer';

export class UpdateIncidentSubZoneDto extends UpdateIncidentZoneDto {
  @IsOptional()
  @IsNumber()
  parent_id: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  reorganize: boolean;
}
