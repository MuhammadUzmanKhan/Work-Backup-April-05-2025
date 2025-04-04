import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { TaskStatus } from '@Common/constants';
import { Urls } from '@Modules/subtask/dto';

class LocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}

export class RecursiveTaskDto {
  @IsArray()
  start_dates: string[];

  @IsArray()
  deadlines: string[];
}

export class CreateTaskDto extends EventIdQueryDto {
  @IsString()
  @Length(3, 200)
  name: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids: number[];

  @IsString()
  @IsOptional()
  start_date: string;

  @IsString()
  deadline: string;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  task_list_id: number;

  @IsOptional()
  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsNumber()
  incident_division_id: number;

  @IsOptional()
  @IsBoolean()
  is_recursive: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecursiveTaskDto)
  recursive: RecursiveTaskDto;

  @IsObject()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  location: LocationDto;

  @IsString()
  @IsOptional()
  color: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Urls)
  taskAttachments: Urls[];
}
