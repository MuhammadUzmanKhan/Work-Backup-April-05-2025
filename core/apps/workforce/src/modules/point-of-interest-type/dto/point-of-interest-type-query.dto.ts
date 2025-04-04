import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  PointOfInterestTypeSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';

export class PointOfInterestTypeQueryParamsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by Point of Interest Type Name',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Sorting Column could be: "name", "updated_at"',
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PointOfInterestTypeSortingColumns)
  sort_column: PointOfInterestTypeSortingColumns;

  @ApiPropertyOptional({
    description: 'Sorting Order could be: ASC, DESC',
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
