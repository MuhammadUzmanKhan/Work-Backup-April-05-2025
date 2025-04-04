import {
  UserDateFormat,
  UserTemperatureFormat,
  UserTimeFormat,
} from '@Common/constants';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  language_code: number;

  @IsOptional()
  @IsEnum(UserDateFormat)
  date_format: UserDateFormat;

  @IsOptional()
  @IsEnum(UserTimeFormat)
  time_format: UserTimeFormat;

  @IsOptional()
  @IsEnum(UserTemperatureFormat)
  temperature_format: UserTemperatureFormat;
}
