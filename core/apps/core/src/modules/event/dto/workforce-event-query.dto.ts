import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  EventSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { Type } from 'class-transformer';

export class WorkforceEventQueryParams extends PaginationDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  user_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventSortingColumns)
  sort_column: EventSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
