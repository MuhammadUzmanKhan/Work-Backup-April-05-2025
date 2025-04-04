import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CsvOrPdfDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import {
  PointOfInterestSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class PointOfInterestQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional({ description: 'Filter by Point of Interest Type' })
  @IsOptional()
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Filter by Point of Interest Name' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Search by Point of Interest Name and Type',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Sorting Column could be: "name", "type", "active", "updated_at"',
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PointOfInterestSortingColumns)
  sort_column: PointOfInterestSortingColumns;

  @ApiPropertyOptional({
    description: 'Sorting Order could be: ASC, DESC',
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
