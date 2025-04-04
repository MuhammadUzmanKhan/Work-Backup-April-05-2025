import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PinnedEventDataDto {
  @ApiProperty({
    description: 'Event Id',
  })
  @IsNumber()
  @Type(() => Number)
  event_id: number;
}
