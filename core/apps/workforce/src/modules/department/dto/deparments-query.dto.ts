import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  EventSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  CsvOrPdfDto,
  EventIdQueryOptionalDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';

export class DepartmentsQueryDto extends IntersectionType(
  PaginationDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  division_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventSortingColumns)
  sort_column: EventSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Pass true for return only Assigned Departments',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_assigned: boolean;
}

export class GetDepartmentByIdQueryDto extends EventIdQueryOptionalDto {}
