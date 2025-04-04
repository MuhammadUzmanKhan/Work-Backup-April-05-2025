import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class EventIncidentReportDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  incident_id!: number;

  @IsOptional()
  @IsBoolean()
  with_changelogs!: boolean;
}
