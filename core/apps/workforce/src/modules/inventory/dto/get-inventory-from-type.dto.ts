import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetInventoryByTypeDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  inventory_type_id: number;
}
