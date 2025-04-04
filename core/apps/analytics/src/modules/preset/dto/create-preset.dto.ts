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
import { Type, Transform } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import {
  EventStatusAPI,
  IncidentPriorityApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { AnalyticsFrequency, WeekDays, MonthDays } from '@Common/constants';

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

class EventFilterDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  company_ids: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  event_regions_ids: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  event_ids: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(EventStatusAPI, { each: true })
  event_statuses: EventStatusAPI[];
}

class IncidentFilterDto {
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
  @IsEnum(IncidentPriorityApi, { each: true })
  priority?: IncidentPriorityApi[];

  @IsOptional()
  @IsArray()
  @IsEnum(StatusFilter, { each: true })
  incident_status?: StatusFilter[];
}

export class FilterDto {
  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => IncidentFilterDto)
  incident_filters: IncidentFilterDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EventFilterDto)
  event_filters: EventFilterDto;

  @ValidateNested()
  @Type(() => DateRangeDto)
  date: DateRangeDto;
}

export class CreatePresetDto extends EventIdQueryDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsEmail()
  @ValidateIf((o) => !!o.frequency)
  email: string;

  @IsEnum(AnalyticsFrequency)
  frequency: AnalyticsFrequency;

  @IsBoolean()
  @ValidateIf((o) => !!o.frequency)
  pdf: boolean;

  @IsBoolean()
  @ValidateIf((o) => !!o.frequency)
  csv: boolean;

  @IsString()
  export_time: string;

  @ValidateIf((o) => o.frequency === AnalyticsFrequency.WEEKLY)
  @IsArray()
  @IsEnum(WeekDays, { each: true })
  week_days?: WeekDays[];

  @ValidateIf((o) => o.frequency === AnalyticsFrequency.MONTHLY)
  @IsEnum(MonthDays)
  month_days?: MonthDays;

  @IsObject()
  @ValidateNested()
  @Type(() => FilterDto)
  filters: FilterDto;
}
