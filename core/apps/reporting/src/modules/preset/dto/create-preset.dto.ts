import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import {
  DispatchedStatusFilter,
  IncidentPriorityApi,
  ResolvedIncidentNoteStatusApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { ReportingFrequency } from '@Common/constants';

export class DateRangeDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message:
      'Date is not valid or not in the correct format. The correct format is: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-06-17T12:30:45Z)',
  })
  start_date: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message:
      'Date is not valid or not in the correct format. The correct format is: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-06-17T12:30:45Z)',
  })
  end_date: string;
}

export class PresetFiltersDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  date?: DateRangeDto;

  @IsOptional()
  @IsArray()
  @IsEnum(StatusFilter, { each: true })
  status?: StatusFilter[];

  @IsOptional()
  @IsArray()
  @IsEnum(DispatchedStatusFilter, { each: true })
  dispatched_status?: DispatchedStatusFilter[];

  @IsOptional()
  @IsArray()
  @IsEnum(IncidentPriorityApi, { each: true })
  priority?: IncidentPriorityApi[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  incident_division_ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  incident_type_ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ResolvedIncidentNoteStatusApi, { each: true })
  resolution_status?: ResolvedIncidentNoteStatusApi[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  incident_zone_ids?: number[];
}
export class CreatePresetDto extends EventIdQueryDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsEmail()
  @ValidateIf((o) => !!o.frequency)
  email: string;

  @IsOptional()
  @IsEnum(ReportingFrequency)
  frequency: ReportingFrequency;

  @IsBoolean()
  @ValidateIf((o) => !!o.frequency)
  pdf: boolean;

  @IsBoolean()
  @ValidateIf((o) => !!o.frequency)
  csv: boolean;

  @IsNumber()
  @ValidateIf((o) => o.frequency === ReportingFrequency.EVENT_COMPLETION)
  buffer: number;

  @IsString()
  @ValidateIf((o) => o.frequency === ReportingFrequency.EVERY_DAY)
  export_time: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PresetFiltersDto)
  filters: PresetFiltersDto;
}
