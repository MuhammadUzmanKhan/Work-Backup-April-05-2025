import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { DatesQueryDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { PriorityDto } from '@Common/dto';

import { PositionDataEnum } from '../helper/enums';

export class GetPositionDataQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
  PriorityDto,
) {
  @ApiPropertyOptional({
    description: 'it will accept column names on which you want sorting',
    enum: PositionDataEnum,
  })
  @IsOptional()
  @IsEnum(PositionDataEnum)
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'it will accept order by ASC | DESC',
    enum: SortBy,
  })
  @IsOptional()
  @IsEnum(SortBy)
  order?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Ensures the value is transformed to a number
  vendor_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Ensures each item in the array is transformed to a number
  shift_id?: number;
}
