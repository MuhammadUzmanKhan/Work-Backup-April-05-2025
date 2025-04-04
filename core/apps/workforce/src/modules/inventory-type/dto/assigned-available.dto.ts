import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class AssignedAvailableQueryParamsDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Inventory type Category id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventory_type_category_id: number;
}
