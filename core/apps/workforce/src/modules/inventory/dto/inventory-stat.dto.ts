import { SCANS } from '@Common/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryOptionalDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class InventoryByStatsDto extends EventIdQueryOptionalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inventory_type_id: number;

  @ApiProperty()
  @IsEnum(SCANS)
  type: SCANS;
}
