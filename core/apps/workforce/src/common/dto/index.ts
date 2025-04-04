import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CloneDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  current_event_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  clone_event_id: number;
}
