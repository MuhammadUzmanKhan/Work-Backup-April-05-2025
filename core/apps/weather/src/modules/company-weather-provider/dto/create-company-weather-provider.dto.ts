import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCompanyWeatherProviderDto {
  @Type(() => Number)
  @IsNumber()
  company_id: number;

  @Type(() => Number)
  @IsNumber()
  weather_provider_id: number;

  @IsString()
  api_key: string;

  @IsString()
  @IsOptional()
  api_secret: string;
}
