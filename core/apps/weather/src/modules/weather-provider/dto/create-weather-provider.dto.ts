import { IsString } from 'class-validator';

export class CreateWeatherProviderDto {
  @IsString()
  name: string;

  @IsString()
  url: string;
}
