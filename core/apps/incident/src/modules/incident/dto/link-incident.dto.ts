import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class LinkIncidentDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  incident_id!: number;

  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  link_incident_ids!: number[];

  @IsOptional()
  @IsBoolean()
  resolve!: boolean;
}

export class UnLinkIncidentDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  incident_id!: number;

  @Type(() => Number)
  @IsNumber()
  unlink_incident_id!: number;
}
