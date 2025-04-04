import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CsvDto,
  DatesQueryDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { StaffSortingColumns } from '@Common/constants';
import { DateFilterDto, PriorityDto } from '@Common/dto';

export class GetStaffByEventDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
  CsvDto,
  DateFilterDto,
  DatesQueryDto,
  PriorityDto,
) {
  @ApiPropertyOptional({
    description: 'Vendor Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;

  @ApiPropertyOptional({
    description: 'Vendor Position Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendor_position_id!: number;

  @ApiPropertyOptional({
    description:
      'To search through Shift name, Vendor name, Role/Position or QR code',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC', enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  order!: SortBy;

  @ApiPropertyOptional({
    description:
      'Sorting column can be expected_start_date, shift_start, shift_end',
    enum: StaffSortingColumns,
  })
  @IsOptional()
  @IsEnum(StaffSortingColumns)
  sort_column!: StaffSortingColumns;

  @ApiPropertyOptional({
    description: 'Prority Check True | False',
  })
  @Transform(({ value }) => Boolean(JSON.parse(value)))
  @IsBoolean()
  @IsOptional()
  is_flagged?: boolean;

  @ApiPropertyOptional({
    description: 'Shift Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shift_id!: number;
}
