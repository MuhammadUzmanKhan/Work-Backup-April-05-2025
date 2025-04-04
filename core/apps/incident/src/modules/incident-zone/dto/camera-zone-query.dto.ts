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
  CsvDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import { IncidentCameraLocationSortingColumns } from '@Common/constants/constants';

export class CameraZoneQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
  CsvDto,
) {
  @ApiPropertyOptional({ description: 'Filter by camera zone name' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Sort Column By name and update_at, ' })
  @IsOptional()
  @IsEnum(IncidentCameraLocationSortingColumns)
  sort_column: IncidentCameraLocationSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({ description: 'Filter by id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    description: 'Filter Incident Camera Zone by location',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_located: boolean;
}
