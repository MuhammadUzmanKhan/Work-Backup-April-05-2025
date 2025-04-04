import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';

export class Urls {
  @IsString()
  name: string;

  @IsUrl()
  url: string;
}

export class CreateEventSubtaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsBoolean()
  @IsOptional()
  completed: boolean;

  @IsOptional()
  @IsDateString()
  deadline: string;

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  description: string;

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => Urls)
  eventSubtasksAttachments: Urls[];
}
