import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class EventIdQueryDto {
  @ApiProperty({
    description: 'Event Id',
  })
  @IsNumber()
  @Min(1, { message: 'Event Id must be greater than 0' })
  @Type(() => Number)
  event_id: number;
}

export class EventIdQueryOptionalDto {
  @ApiPropertyOptional({
    description: 'Event Id',
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Event Id must be greater than 0' })
  @Type(() => Number)
  event_id: number;
}

export class EventIdsBodyDto {
  @ApiProperty({
    description: 'Event Ids',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(1, { each: true, message: 'Each Event Id must be greater than 0' })
  @ArrayMinSize(1, { message: 'Event Ids List should not be empty' })
  event_ids: number[];
}
