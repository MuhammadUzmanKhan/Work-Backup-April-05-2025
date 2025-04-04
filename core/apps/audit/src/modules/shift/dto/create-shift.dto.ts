import {
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateShiftDto extends EventIdQueryDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'start_dates should not be empty' })
  @IsString({ each: true })
  @IsISO8601({ strict: true }, { each: true })
  start_dates!: string[];

  @IsArray()
  @ArrayNotEmpty({ message: 'end_dates should not be empty' })
  @IsString({ each: true })
  @IsISO8601({ strict: true }, { each: true })
  end_dates!: string[];
}
