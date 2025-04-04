import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IntersectionType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  EventSortingColumns,
  EventStatusAPI,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  PaginationDto,
  CsvDto,
  CompanyIdOptionalDto,
  RegionIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  EventRequestSortingColumns,
  REQUEST_EVENT_TYPE,
} from '@Common/constants';

export class EventQueryParams extends IntersectionType(
  PaginationDto,
  CsvDto,
  RegionIdDto,
) {
  @ApiPropertyOptional({
    description:
      'Pass Company Id or Sub Company Id in this filter to fetch events accordingly. It will work for both parent and subsidiary companies',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public_start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public_end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventStatusAPI, { each: true })
  status: EventStatusAPI[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventSortingColumns)
  sort_column: EventSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description:
      'event_category must be one of the following values: venues, festivals',
  })
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;

  @ApiPropertyOptional({
    description:
      'If you want to exclude Demo then send true, it will return all events except demo events',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  exclude_demo_events: boolean;

  @ApiPropertyOptional({
    description:
      'If you want to show only Demo then send true, it will return all the events',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  show_demo_events: boolean;

  @ApiPropertyOptional({
    description:
      'If you want to include Requested Events then send true, it will return all events including requested events',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  include_requested_events: boolean;
}

export class EventNameQueryParams extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}

export class EventNamesQueryParams extends IntersectionType(
  PaginationDto,
  CompanyIdOptionalDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  selected_id: number;
}

export class EventRequestStatusParams extends IntersectionType(
  PaginationDto,
  CsvDto,
  RegionIdDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public_start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public_end_date: string;

  @ApiPropertyOptional({
    description: 'Sort Column',
    enum: EventRequestSortingColumns,
  })
  @IsOptional()
  @IsEnum(EventRequestSortingColumns)
  sort_column: EventRequestSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;

  @ApiPropertyOptional({
    description:
      'If you want to show only Demo then send true, it will return all the demo events',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  show_demo_events: boolean;
}
