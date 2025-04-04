import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CloneDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Event Id must be greater than 0' })
  current_event_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Event Id must be greater than 0' })
  clone_event_id: number;
}
