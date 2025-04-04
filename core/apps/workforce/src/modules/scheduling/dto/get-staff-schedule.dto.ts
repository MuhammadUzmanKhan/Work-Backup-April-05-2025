import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ScheduleSortingColumns } from '@Common/constants';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';

export class GetStaffScheduleDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  division_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ScheduleSortingColumns)
  sort_column: ScheduleSortingColumns;
}
