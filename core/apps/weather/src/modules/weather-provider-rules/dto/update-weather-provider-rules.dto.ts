import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWeatherProviderRulesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Wind_Spd should not be empty' })
  wind_spd: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Temperature should not be empty' })
  temp: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Wind_Cdir should not be empty' })
  wind_cdir: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;
}
