import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateWeatherProviderRulesDto {
  @Type(() => Number)
  @IsNumber()
  weather_provider_id: number;

  @IsString()
  wind_spd: string;

  @IsString()
  temp: string;

  @IsString()
  wind_cdir: string;

  @IsString()
  description: string;
}
