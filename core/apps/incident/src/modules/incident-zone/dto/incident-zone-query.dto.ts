import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  EventIdQueryDto,
  PaginationDto,
  DateFilterDto,
  CsvOrPdfDto,
} from '@ontrack-tech-group/common/dto';

export class IncidentZoneQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
  CsvOrPdfDto,
  DateFilterDto,
) {
  @ApiPropertyOptional({ description: 'Filter by incident zone name' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Filter by incident zone color' })
  @IsOptional()
  @IsString()
  color: string;

  @ApiPropertyOptional({ description: 'Filter by sequence' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  filter_by_sequence: number;

  @ApiPropertyOptional({ description: 'Filter by id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Filter by incident zone having dimensions',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_located: boolean;

  @ApiPropertyOptional({
    description: 'Filter incident zone to search keyword in subzone',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  dashboard_listing: boolean;
}
