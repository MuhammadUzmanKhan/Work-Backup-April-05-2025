import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { TaskStatus } from '@Common/constants';

export class CloneListOrTaskDto {
  @IsNumber()
  cloning_event_id: number; //From which event task or list needs to be cloned.

  @IsArray()
  @ValidateNested()
  @Type(() => ListedTasksDto)
  listed_tasks: ListedTasksDto[];

  @IsArray()
  @ValidateNested()
  @Type(() => TasksDto)
  standalone_tasks: TasksDto[];
}

export class TasksDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsBoolean()
  isSubtasksClone: boolean;

  @IsOptional()
  @IsBoolean()
  isAttachmentsClone: boolean;

  @IsString()
  start_date: string;

  @IsString()
  deadline: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  completed_at: string;
}

export class ListedTasksDto extends TasksDto {
  @IsNumber()
  task_list_id: number;
}

export class EventNamesQueryParams extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by Event Name' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiProperty({ description: 'Company Id of selected Event' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;
}

export class TaskNamesQueryParams extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Task List Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  task_list_id: number;
}
