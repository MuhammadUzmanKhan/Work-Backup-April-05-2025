import { IsString } from 'class-validator';

export class LocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}
