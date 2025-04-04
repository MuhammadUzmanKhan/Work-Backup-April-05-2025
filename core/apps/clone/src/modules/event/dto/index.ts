import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidatorHelper } from '@Common/helpers';

export class CloneEventDto {
  @ApiProperty()
  @IsDateString()
  @ValidatorHelper.IsNotPastDate({
    message: 'Start date must not be in the past',
  })
  start_date: string;

  @ApiProperty()
  @IsDateString()
  @ValidatorHelper.IsEndDateAfterStartDate('start_date', {
    message: 'End date must be after start date',
  })
  end_date: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;
}

export class ImportEventDto {
  @IsOptional()
  @ApiPropertyOptional()
  @IsNumber()
  source_event_id: number;
}
