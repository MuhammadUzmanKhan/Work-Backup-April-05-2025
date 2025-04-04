import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanyWeatherProviderDto {
  @IsOptional()
  @IsString()
  api_key: string;

  @IsOptional()
  @IsString()
  api_secret: string;
}
