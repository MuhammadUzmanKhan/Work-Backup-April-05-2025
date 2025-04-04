import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import { TaskStatus } from '@Common/constants';

export class CreateSubtaskDto {
  @IsNumber()
  parent_id: number;

  @IsString()
  @Length(3, 200)
  name: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsString()
  @IsOptional()
  start_date: string;

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
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsBoolean()
  priority: boolean;
}

export class Urls {
  @IsString()
  name: string;

  @IsUrl()
  url: string;
}
