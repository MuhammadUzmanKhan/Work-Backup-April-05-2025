import { WeatherProviderRequestStatus } from '@Common/constants';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWeatherProviderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'URL should not be empty' })
  url: string;

  @IsOptional()
  @IsEnum(WeatherProviderRequestStatus)
  request_status: WeatherProviderRequestStatus;
}
