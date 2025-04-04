import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateTaskListDto extends EventIdQueryDto {
  @IsOptional()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @IsNumber()
  order: number;
}

export class UpdateMultipleTasksDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsString()
  current_date: string;

  @IsOptional()
  @IsBoolean()
  is_subtask: boolean;

  @ValidateIf(({ is_subtask }) => is_subtask)
  @IsNumber(
    {},
    {
      message:
        'Task ID is required when updating multiple deadlines for subtasks.',
    },
  )
  task_id: number;
}
