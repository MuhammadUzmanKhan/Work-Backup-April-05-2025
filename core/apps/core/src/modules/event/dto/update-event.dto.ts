import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventGenre,
  EventStatusAPI,
} from '@ontrack-tech-group/common/constants';
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
  ValidateNested,
  Length,
} from 'class-validator';
import { LocationDto } from './create-event.dto';
import { REQUEST_EVENT_TYPE, REQUEST_STATUS } from '@Common/constants';
import { CreateEventCadInEventDto } from '@Modules/event-cads/dto';

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Length(3, 50)
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url: string;

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
  @IsString()
  @Length(0, 3000)
  about_event: string;

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
  @IsString()
  venue_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event_location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time_zone: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public_start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
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
  transportation_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  workforce_messaging: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vendor_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  staff_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  service_request_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reservation_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  audit_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pre_show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  post_show_block: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  messaging_capability: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  message_service: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lost_and_found_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inventory_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  guest_messaging: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dot_map_service: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deposit_full_charges: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  department_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  camping_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hourly_rate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  total_hours: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicle_count: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
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
  @IsBoolean()
  ticket_clear_template_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  event_form_future: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  external_event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  dialer_layout: REQUEST_EVENT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dialer_dispatch_layout: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  event_category: REQUEST_EVENT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  division_lock_service: boolean;

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

export class UpdateEventStatusDto {
  @ApiProperty()
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;
}
export class UpdateEventRequestStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(REQUEST_STATUS)
  request_status: REQUEST_STATUS;
}
