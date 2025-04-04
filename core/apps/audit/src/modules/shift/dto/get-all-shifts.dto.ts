import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { AllShiftsSortingColumns } from '@Common/constants';
import { DateFilterDto } from '@Common/dto';

export class GetAllShiftsDto extends IntersectionType(
  EventIdQueryDto,
  DateFilterDto,
) {
  @ApiPropertyOptional({ description: 'To search through name of shifts.' })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order!: SortBy;

  @ApiPropertyOptional({
    description:
      'Sorting column can be name, start_date, start_time, end_time, workers',
  })
  @IsOptional()
  @IsEnum(AllShiftsSortingColumns)
  sort_column!: AllShiftsSortingColumns;

  @ApiPropertyOptional({
    description: 'Vendor Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;

  @ApiPropertyOptional({
    description:
      'To retrieve shifts for a selected role / vendor position, pass the vendor_position_id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendor_position_id!: number;
}
