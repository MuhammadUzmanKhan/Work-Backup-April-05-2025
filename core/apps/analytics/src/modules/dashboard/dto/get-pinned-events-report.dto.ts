import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  SortBy,
  IncidentPriorityApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { PinnedEventsIncidentsListingColumns } from '@Common/constants';

export class PinnedEventsIncidentsDto extends IntersectionType(
  PaginationDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional({
    description:
      'Keyword for search (id, event_name, incident_zone_name, incident_division_name, incident_type, description, dispatch_user)',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_division_ids=123&incident_division_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_division_ids: number[];

  @ApiPropertyOptional({
    description:
      'Incident Status by open, dispatched, resolved, archived, follow_up, in_route, at_scene, responding',
  })
  @IsOptional()
  @IsEnum(StatusFilter)
  incident_status: StatusFilter;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_type_ids=123&incident_type_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_type_ids: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like department_ids=123&department_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  department_ids: number[];

  @ApiPropertyOptional({
    description: 'Incident Priority must be low, medium, high, critical',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  incident_priority: IncidentPriorityApi;

  @ApiPropertyOptional({
    description:
      'Sort column by id, event_name, incident_zone_name, incident_division_name, created_at, logged_date_time, incident_type, status, priority, description, dispatch_user',
  })
  @IsOptional()
  @IsEnum(PinnedEventsIncidentsListingColumns)
  sort_column: PinnedEventsIncidentsListingColumns;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
