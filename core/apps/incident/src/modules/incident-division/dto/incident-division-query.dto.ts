import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CsvOrPdfDto,
  DateFilterDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { IncidentWorkforceSortingColumns } from '@Common/constants';

export class IncidentDivisionQueryParamsDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
  CsvOrPdfDto,
  DateFilterDto,
) {
  @ApiPropertyOptional({ description: 'Pass Name' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pass true for return only Assigned Incident Division',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_assigned: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return resolved time in response',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  return_resolved_time: boolean;

  @ApiPropertyOptional({
    description: 'Sort Column By updated_at, incidents_count',
  })
  @IsOptional()
  @IsEnum(IncidentWorkforceSortingColumns)
  sort_column: IncidentWorkforceSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description:
      'Pass true for return incident divisions along with no Division with incident counts',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  division_not_available: boolean;

  @ApiPropertyOptional({
    description:
      'Pass true for return top 10 incident divisions with highest incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  top_sorted: boolean;
}
