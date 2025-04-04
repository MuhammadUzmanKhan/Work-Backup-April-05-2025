import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  FilterCondition,
  FilterField,
  TaskSortingColumns,
  TaskStatusFilter,
} from '@Common/constants';

class CommonTaskQueryDto {
  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsEnum(TaskStatusFilter)
  status: TaskStatusFilter;

  @IsOptional()
  @IsBoolean()
  me: boolean;

  @IsOptional()
  @IsBoolean()
  completed: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => FilterDTO)
  @ValidateNested({ each: true })
  filters: FilterDTO[];

  @IsOptional()
  @IsBoolean()
  self_created: boolean;
}

export class FilterDTO {
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsEnum(FilterField)
  filter: FilterField;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsEnum(FilterCondition)
  condition: FilterCondition;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @Type(() => String)
  @IsArray()
  values: string[];
}

export class TaskListQueryDto extends IntersectionType(
  EventIdQueryDto,
  CsvOrPdfDto,
  CommonTaskQueryDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  selected_list: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(TaskSortingColumns)
  sort_column: TaskSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  sort_by: SortBy;
}

export class TaskByListDto extends IntersectionType(
  EventIdQueryDto,
  CommonTaskQueryDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  task_list_id: number;

  @ApiPropertyOptional({
    description: 'Sorting Column',
    enum: TaskSortingColumns,
  })
  @IsOptional()
  @IsEnum(TaskSortingColumns)
  sort_column: TaskSortingColumns;

  @ApiPropertyOptional({ description: 'Sort By', enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  sort_by: SortBy;
}

export class TaskListNamesQueryDto extends IntersectionType(
  EventIdQueryDto,
  CommonTaskQueryDto,
) {}
