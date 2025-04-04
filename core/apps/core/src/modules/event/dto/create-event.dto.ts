import {
  EventGenre,
  EventStatusAPI,
  EventType,
} from '@ontrack-tech-group/common/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import { REQUEST_EVENT_TYPE } from '@Common/constants';
import { CreateEventCadInEventDto } from '@Modules/event-cads/dto';

export class SubLocationDto {
  @ApiProperty()
  @IsString()
  latitude: string;

  @ApiProperty()
  @IsString()
  longitude: string;
}

export class LocationDto {
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SubLocationDto)
  top_left: SubLocationDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SubLocationDto)
  top_right: SubLocationDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SubLocationDto)
  bottom_left: SubLocationDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SubLocationDto)
  bottom_right: SubLocationDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => SubLocationDto)
  center: SubLocationDto;
}

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo: string;

  @ApiProperty()
  @IsString()
  @Length(0, 3000)
  about_event: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  start_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  end_time: string;

  @ApiProperty()
  @IsString()
  event_location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventType)
  event_type: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pre_show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  post_show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expected_attendance: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  daily_attendance: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  external_event_id: number;

  @ApiProperty()
  @IsBoolean()
  staff_future: boolean;

  @ApiProperty()
  @IsBoolean()
  department_future: boolean;

  @ApiProperty()
  @IsBoolean()
  vendor_future: boolean;

  @ApiProperty()
  @IsBoolean()
  reservation_future: boolean;

  @ApiProperty()
  @IsBoolean()
  camping_future: boolean;

  @ApiProperty()
  @IsBoolean()
  inventory_future: boolean;

  @ApiProperty()
  @IsBoolean()
  service_request_future: boolean;

  @ApiProperty()
  @IsBoolean()
  incident_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incident_future_v2: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reporting_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dot_map_service_v2: boolean;

  @ApiProperty()
  @IsBoolean()
  transportation_future: boolean;

  @ApiProperty()
  @IsBoolean()
  lost_and_found_future: boolean;

  @ApiProperty()
  @IsBoolean()
  audit_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicle_count: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  total_hours: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time_zone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hourly_rate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deposit_full_charges: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archive: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dot_map_service: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventGenre)
  key_genre: EventGenre;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventGenre)
  genre: EventGenre;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventGenre)
  sub_genre: EventGenre;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  url: string;

  @IsDateString()
  public_start_date: string;

  @IsDateString()
  public_end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public_start_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public_end_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  message_service: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  task_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  demo_event: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;

  @ApiProperty()
  @IsBoolean()
  ticket_clear_template_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  event_form_future: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateEventCadInEventDto)
  event_cads: CreateEventCadInEventDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  venue_id: number;
}

export class EventUploadCSVDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  event_location: string;

  @IsString()
  venue_name: string;

  @IsDateString()
  public_start_date: string;

  @IsDateString()
  public_end_date: string;

  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;

  @IsOptional()
  @IsNumber()
  expected_attendance: number;

  @IsOptional()
  @IsNumber()
  daily_attendance: number;
}

export class UploadEventDto {
  @IsString()
  file: string;

  @IsNumber()
  company_id: number;
}
