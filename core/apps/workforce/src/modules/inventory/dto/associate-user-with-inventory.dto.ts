import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class AssociateUserWithInventoryDto extends EventIdQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  inventory_id: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  department_id: number;
}
