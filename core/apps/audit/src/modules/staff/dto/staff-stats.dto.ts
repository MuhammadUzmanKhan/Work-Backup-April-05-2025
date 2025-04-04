import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { DatesQueryDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { PriorityDto } from '@Common/dto';

export class StaffStatsDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
  PriorityDto,
) {
  @ApiPropertyOptional({
    description: 'Vendor Id',
  })
  @Transform(({ value }) => parseInt(value, 10)) // Convert string to number
  @IsOptional()
  @IsNumber({}, { message: 'Vendor ID must be a valid number.' })
  @Min(1, { message: 'Vendor ID must be greater than 0.' })
  vendor_id?: number;
}

export class StaffStatsSummaryDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
  PriorityDto,
) {}
