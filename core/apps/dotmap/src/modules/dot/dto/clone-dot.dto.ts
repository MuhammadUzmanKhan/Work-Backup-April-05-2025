import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CloneDotDto extends EventIdQueryDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  dot_ids: number[];

  @Min(1, { message: 'Quantity must be at least 1' }) // Add minimum value validation
  @IsNumber()
  @Type(() => Number)
  quantity: number;
}
