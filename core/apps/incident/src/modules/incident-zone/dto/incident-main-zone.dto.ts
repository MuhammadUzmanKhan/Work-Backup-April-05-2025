import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { IncidentZoneSortingColumns } from '@Common/constants/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentZoneQueryParamsDto } from './incident-zone-query.dto';

export class IncidentMainZoneQueryParamsDto extends IncidentZoneQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Pass true for return resolved time in response',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  return_resolved_time: boolean;

  @ApiPropertyOptional({
    description:
      'Sort Column By name, incidents_count, incident_sub_zone_count and update_at',
  })
  @IsOptional()
  @IsEnum(IncidentZoneSortingColumns)
  sort_column: IncidentZoneSortingColumns;

  @ApiPropertyOptional({
    description:
      'Pass true for return incident zones along with no zone(field location logged) having incident counts',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  zone_not_available: boolean;

  @ApiPropertyOptional({
    description:
      'Pass true for return top 10 incident zones with highest incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  top_sorted: boolean;

  @ApiPropertyOptional({
    description: 'Filter incident zone to search keyword in subzone',
  })
  @IsOptional()
  @IsBoolean()
  dashboard_listing: boolean;
}
