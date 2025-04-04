import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class MarkCommentRead extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  incident_id!: number;
}
