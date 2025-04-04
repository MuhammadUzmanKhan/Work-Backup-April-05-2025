import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  IncidentSortingColumns,
  IncidentStatusDashboardType,
} from '@Common/constants';
import { CommonFiltersDto } from '.';

export class IncidentListDto extends IntersectionType(
  CommonFiltersDto,
  PaginationDto,
) {
  @ApiPropertyOptional({
    description: 'Filter by status of open, follow_up, resolved, dispatched',
  })
  @IsOptional()
  @IsEnum(IncidentStatusDashboardType)
  status: IncidentStatusDashboardType;

  @ApiPropertyOptional({
    description: 'Keyword for search (type, event name, company name)',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Sort column by id, incident_type, event_name, company_name, status, created_at',
  })
  @IsOptional()
  @IsEnum(IncidentSortingColumns)
  sort_column: IncidentSortingColumns;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
