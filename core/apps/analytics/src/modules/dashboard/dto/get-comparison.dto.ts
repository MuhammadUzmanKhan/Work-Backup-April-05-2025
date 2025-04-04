import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class ComparisonDto {
  @ApiProperty({ description: 'First Event Id' })
  @Type(() => Number)
  @IsNumber()
  first_event_id: number;

  @ApiProperty({ description: 'Second Event Id' })
  @Type(() => Number)
  @IsNumber()
  second_event_id: number;
}

export class GraphComparisonDto extends ComparisonDto {
  @ApiProperty({
    description:
      'Hour difference to be aggregated for graph. For example if 6 then incidents will be aggregated in 6 hours chunks',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  hour_difference: number;
}
