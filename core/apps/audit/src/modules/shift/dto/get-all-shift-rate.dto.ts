import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllShiftRates extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'Pass vendor id to get shifts against that vendor only',
  })
  @IsNumber({}, { message: 'vendor_id must be a valid number' })
  @Type(() => Number)
  vendor_id!: number;
}
