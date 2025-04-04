import {
  IsOptional,
  IsString,
  ValidateNested,
  IsObject,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class LocationCoordinates {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}

export class Location {
  @ValidateNested()
  @Type(() => LocationCoordinates)
  top_left: LocationCoordinates;

  @ValidateNested()
  @Type(() => LocationCoordinates)
  top_right: LocationCoordinates;

  @ValidateNested()
  @Type(() => LocationCoordinates)
  bottom_left: LocationCoordinates;

  @ValidateNested()
  @Type(() => LocationCoordinates)
  bottom_right: LocationCoordinates;

  @ValidateNested()
  @Type(() => LocationCoordinates)
  center: LocationCoordinates;
}

export class CreateCadDto extends EventIdQueryDto {
  @IsNumber()
  cad_type_id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsUrl()
  image_url: string;

  @IsOptional()
  @IsString()
  image_name: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Location)
  location: Location;
}
