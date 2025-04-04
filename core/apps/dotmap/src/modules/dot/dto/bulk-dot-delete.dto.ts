import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class BulkDotsDeleteDto extends EventIdQueryDto {
  @ApiProperty({
    description: 'Pass array of dot Ids i.e dot_ids=1&dot_ids=2&dot_ids=3',
  })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  dot_ids: number[];
}
