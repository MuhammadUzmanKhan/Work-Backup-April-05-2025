import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolesEnum, UserStatuses } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { REQUEST_EVENT_TYPE } from '@Common/constants';

class LocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;

  @IsOptional()
  @IsNumber()
  distance: number;

  @IsOptional()
  @IsString()
  eta: string;

  @IsOptional()
  @IsNumber()
  speed: number;

  @IsOptional()
  @IsNumber()
  battery_level: number;
}

class UpdateUserCompanyDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;

  @IsOptional()
  @IsString()
  @IsEnum(RolesEnum)
  role: RolesEnum;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;
}

export class MoveStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;
}

export class CreateUserDto {
  @Length(2, 50)
  @IsString()
  first_name: string;

  @IsString()
  @Length(2, 50)
  last_name: string;

  @IsString()
  @Length(2, 50)
  name: string;

  @ValidateIf((o) => !o.reference_user)
  @IsNumberString({}, { message: 'Cell must be numeric only' })
  @Length(7, 20, { message: 'Cell must be between 7 and 20 characters long' })
  cell: string;

  @ValidateIf((o) => !o.reference_user)
  @IsString()
  @IsEnum(RolesEnum)
  role: RolesEnum;

  @IsOptional()
  @IsString()
  @IsEnum(UserStatuses)
  status: UserStatuses;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  division_ids: number[];

  @IsOptional()
  @IsString()
  country_code: string;

  @IsOptional()
  @IsString()
  pin: string;

  @IsOptional()
  @IsString()
  country_iso_code: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  password_confirmation: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  vendor_id: number;

  @IsOptional()
  @IsBoolean()
  demo_user: boolean;

  @IsOptional()
  @IsString()
  language_code: string;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @IsOptional()
  @IsEnum(REQUEST_EVENT_TYPE)
  user_category: REQUEST_EVENT_TYPE;

  @ValidateIf(
    (o) =>
      o.role === RolesEnum.REGIONAL_MANAGER ||
      o.role === RolesEnum.GLOBAL_MANAGER,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  region_ids: number[];

  @IsOptional()
  @IsBoolean()
  reference_user: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MultipleEventsAssociateDto)
  multiple_events_association: MultipleEventsAssociateDto[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  first_name: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  last_name: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Cell must be numeric only' })
  @Length(7, 20, { message: 'Cell must be between 7 and 20 characters long' })
  cell: string;

  @IsOptional()
  @IsString()
  @IsEnum(RolesEnum)
  role: RolesEnum;

  @IsOptional()
  @IsString()
  country_code: string;

  @IsOptional()
  @IsString()
  country_iso_code: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  password_confirmation: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserStatuses)
  status: UserStatuses;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  pin: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @IsNumber()
  department_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  vendor_id: number;

  @IsOptional()
  @IsBoolean()
  demo_user: boolean;

  @IsOptional()
  @IsString()
  language_code: string;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  division_ids: number[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MoveStaffDto)
  move_staff: MoveStaffDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserCompanyDto)
  user_company: UpdateUserCompanyDto;

  @ValidateIf(
    (o) =>
      o.role === RolesEnum.REGIONAL_MANAGER ||
      o.role === RolesEnum.GLOBAL_MANAGER,
  )
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  region_ids: number[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MultipleEventsAssociateDto)
  multiple_events_association: MultipleEventsAssociateDto[];
}

export class CreateUserLocationDto extends EventIdQueryDto {
  @Type(() => Number)
  @Min(1)
  @IsNumber()
  user_id: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

export class GetDepartmentsUsers extends EventIdQueryDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  department_ids: number[];

  @IsOptional()
  @IsBoolean()
  hide_upper_role: boolean;

  @IsOptional()
  @IsBoolean()
  event_users: boolean;
}

export class MultipleEventsAssociateDto extends EventIdQueryDto {
  @IsOptional()
  @IsBoolean()
  should_activate: boolean;
}
