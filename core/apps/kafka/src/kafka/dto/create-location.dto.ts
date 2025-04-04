import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserLocationDto extends EventIdQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Latitude should not be empty' })
  latitude: string;

  @IsString()
  @IsNotEmpty({ message: 'Longitude should not be empty' })
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
