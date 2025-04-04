import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  InventorySortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetInventoryDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staff_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inventory_type_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_scan_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(InventorySortingColumns)
  sort_column: InventorySortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
