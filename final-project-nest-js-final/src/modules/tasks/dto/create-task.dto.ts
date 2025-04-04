import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsNumber,
  MinLength,
  IsEnum,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

import { Type } from 'class-transformer';
import {
  IsDateGreaterThan,
  IsDateLessThan,
} from 'src/common/decorators/is-before-validation';

export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  userIds?: number[];

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;
}

export class CreateTaskValidationDto extends CreateTaskDto {
  @IsDateLessThan('endDate', {
    message: 'Start date must be less than end date',
  })
  startDate: Date;
  @IsDateGreaterThan('startDate', {
    message: 'End date must be greater than start date',
  })
  endDate: Date;
}
