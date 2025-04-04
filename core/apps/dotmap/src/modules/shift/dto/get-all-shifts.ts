import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllShifts extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'Pass vendor id to get shifts against that vendor only',
  })
  @IsOptional()
  @Type(() => Number)
  vendor_id: number;
}
