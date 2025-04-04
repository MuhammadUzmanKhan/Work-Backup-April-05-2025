import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class ComparisonEventsDataDto {
  @ApiProperty({
    description: 'Event Ids',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'Event Ids should not be empty' })
  event_ids: number[];
}
