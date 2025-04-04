import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import { TaskStatus } from '@Common/constants';

export class SubTaskChangelogs {
  @IsOptional()
  @IsBoolean()
  isNameUpdated: boolean;

  @IsOptional()
  @IsBoolean()
  isDescriptionUpdated: boolean;

  @IsOptional()
  @IsBoolean()
  isDeadlineUpdated: boolean;

  @IsOptional()
  @IsBoolean()
  isAttachmentUpdated: boolean;

  @IsOptional()
  @IsBoolean()
  isStatusUpdated: boolean;

  @IsOptional()
  @IsBoolean()
  isStartDateUpdated: boolean;
}

export class UpdateSubtaskDto {
  @IsNumber()
  parent_id: number;

  @IsString()
  @IsOptional()
  @Length(3, 200)
  name: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsString()
  @IsOptional()
  start_date: string;

  @IsOptional()
  @IsDateString()
  deadline: string;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids: number[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => Urls)
  subtasksAttachments: Urls[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SubTaskChangelogs)
  subtask_change_log: SubTaskChangelogs;

  @IsOptional()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsBoolean()
  priority: boolean;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  completed_at: string;

  @IsString()
  @IsOptional()
  completed_past_due_duration: string;
}

class Urls {
  @IsString()
  name: string;

  @IsUrl()
  url: string;
}
