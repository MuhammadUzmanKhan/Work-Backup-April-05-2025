import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSubZoneSortingColumns } from '@Common/constants/constants';
import { IncidentZoneQueryParamsDto } from '.';

export class IncidentSubZoneQueryParamsDto extends IncidentZoneQueryParamsDto {
  @ApiPropertyOptional({ description: 'Parent Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parent_id: number;

  @ApiPropertyOptional({
    description:
      'Sort Column By name, incidents_count, parent_zone and update_at',
  })
  @IsOptional()
  @IsEnum(IncidentSubZoneSortingColumns)
  sort_column: IncidentSubZoneSortingColumns;
}
