import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { ChangeLogColumns, TaskStatus } from '@Common/constants';
import { Urls } from '@Modules/subtask/dto';

class LocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}

export class UpdateTaskDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids: number[];

  @IsOptional()
  @IsString()
  start_date: string;

  @IsOptional()
  @IsString()
  deadline: string;

  @IsOptional()
  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsNumber()
  task_list_id: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsObject()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsEnum(ChangeLogColumns)
  change_log_column: ChangeLogColumns;

  @IsString()
  @IsOptional()
  color: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Urls)
  taskAttachments: Urls[];

  @IsOptional()
  @IsNumber()
  order: number;

  @IsString()
  @IsOptional()
  completed_past_due_duration: string;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  completed_at: string;
}

export class UpdateTaskAssigneeDto extends EventIdQueryDto {
  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  department_id: number;
}

class RecursiveTasksDto {
  @IsArray()
  @IsString({ each: true })
  start_dates: string[];

  @IsArray()
  @IsString({ each: true })
  deadlines: string[];
}

export class UpdateMultipleTasksDto extends EventIdQueryDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  task_ids: number[];

  @IsOptional()
  @IsNumber()
  list_id: number;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsString()
  deadline: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecursiveTasksDto)
  recursive: RecursiveTasksDto;
}
