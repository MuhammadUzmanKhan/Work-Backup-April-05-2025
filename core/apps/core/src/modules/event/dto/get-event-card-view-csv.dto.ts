import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
import { REQUEST_EVENT_TYPE } from '@Common/constants';

export class GetEventCardViewCsvBody {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  completed: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  in_progress: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  on_hold: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  upcoming: number;
}

export class GetEventCardViewCsvParams {
  @ApiProperty()
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
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventSortingColumns)
  sort_column: EventSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;
}
