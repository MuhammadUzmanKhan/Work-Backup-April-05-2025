import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { EventStatusAPI } from '@ontrack-tech-group/common/constants';
import { PaginationDto, RegionIdDto } from '@ontrack-tech-group/common/dto';
import { DashboardTopFilter } from '@Common/constants';

export class EventsByStatusQueryDto extends IntersectionType(
  PaginationDto,
  RegionIdDto,
) {
  @ApiPropertyOptional({
    description:
      'Filter of parent companies, sub companies, global or events. Values can be "Parent"(universal view (Super Admin, OnTrack Manager)), "Child"(universal view (Super Admin, OnTrack Manager)), "Global"(only for global view (Global Admin, Global Manager, Regional Manager, Regional Admin)), "Event"(For all views (For all Roles)) ',
  })
  @IsOptional()
  @IsEnum(DashboardTopFilter)
  dashboard_top_filter: DashboardTopFilter;

  @ApiPropertyOptional({ description: 'Year i.e 2023' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiPropertyOptional({
    description: 'Company Id',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id: number;

  @ApiPropertyOptional({
    description:
      'Show Events according to selected status, status can be: upcoming, in_progress, completed, on_hold',
  })
  @IsOptional()
  @IsEnum(EventStatusAPI)
  event_status: EventStatusAPI;
}
