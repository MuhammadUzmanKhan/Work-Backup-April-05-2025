import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { TaskStatus } from '@Common/constants';

export class SubtaskDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsString()
  deadline: string;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsBoolean()
  priority: boolean;
}

export class SingleTaskDto {
  @IsString()
  name: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsString()
  deadline: string;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsString()
  list_name: string;

  @IsOptional()
  @IsBoolean()
  priority: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks: SubtaskDto[];
}

export class CreateBulkTaskDto extends EventIdQueryDto {
  @IsArray()
  @ValidateNested()
  @Type(() => SingleTaskDto)
  tasks: SingleTaskDto[];
}
