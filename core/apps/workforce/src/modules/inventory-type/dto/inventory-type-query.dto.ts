import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { InventoryTypeImage } from '@ontrack-tech-group/common/constants';

export class InventoryTypeQueryParamsDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Inventory type Category id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventory_type_category_id: number;

  @ApiPropertyOptional({ description: 'Pass event id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  check_event_id: number;

  @ApiPropertyOptional({ description: 'Department id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id: number;

  @ApiPropertyOptional({ description: 'Select image filter type' })
  @IsOptional()
  @IsEnum(InventoryTypeImage)
  has_image_or_comment: InventoryTypeImage;
}
