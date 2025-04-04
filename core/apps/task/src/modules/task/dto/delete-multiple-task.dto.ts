import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DeleteMultipleTasksDto extends EventIdQueryDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  task_ids: number[];
}
