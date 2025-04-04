import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsNumber,
  MinLength,
} from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly status?: TaskStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  readonly userIds?: number[];

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;
}
