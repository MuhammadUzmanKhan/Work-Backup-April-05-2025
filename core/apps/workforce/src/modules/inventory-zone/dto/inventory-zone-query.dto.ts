import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { InventoryTypeImage } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class InventoryZoneQueryParamsDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Filter by sequence' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  filter_by_sequence: number;

  @ApiPropertyOptional({ description: 'Select image filter type' })
  @IsOptional()
  @IsEnum(InventoryTypeImage)
  has_image_or_comment: InventoryTypeImage;
}
