import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class AssignOrRemoveToEventDto extends EventIdQueryDto {
  @ApiProperty({
    description: 'Array of source id',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  source_ids: number[];
}
