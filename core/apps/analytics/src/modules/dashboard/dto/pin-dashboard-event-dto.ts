import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class PinDashboardEventDto {
  @ApiPropertyOptional({
    type: () => [EventOrderDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventOrderDto)
  event_orders: EventOrderDto[];
}

export class EventOrderDto extends EventIdQueryDto {
  @IsNumber()
  order: number;
}
