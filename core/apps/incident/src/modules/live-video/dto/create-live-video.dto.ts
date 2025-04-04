import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { LiveVideoRole, LiveVideoType } from '@Common/constants';

export class LocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}

export class CreateLiveVideoDto extends EventIdQueryDto {
  @IsNumber()
  department_id: number;

  @IsEnum(LiveVideoType)
  video_type: LiveVideoType;

  @IsNumber()
  video_id: number;

  @IsEnum(LiveVideoRole)
  role: LiveVideoRole;

  @IsString()
  publisher_name: string;

  @IsString()
  channel_id: string;

  @IsString()
  channel_name: string;

  @IsOptional()
  @IsString()
  uid: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
