import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetInventoryTypeDto extends EventIdQueryDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  inventory_type_category_id: number;
}
