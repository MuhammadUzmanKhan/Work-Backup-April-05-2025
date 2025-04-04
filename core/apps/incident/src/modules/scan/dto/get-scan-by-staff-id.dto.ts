import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import {
  ScanListSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetScanByStaffAndEventIdDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiProperty({ description: 'User or staff id' })
  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @ApiPropertyOptional({ description: 'Filter by scan type' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ScanListSortingColumns)
  sort_column: ScanListSortingColumns;
}
