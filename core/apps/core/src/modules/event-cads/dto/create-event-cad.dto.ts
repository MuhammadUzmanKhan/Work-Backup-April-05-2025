import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';
import { EventCadType } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateEventCadDto extends EventIdQueryDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  name: string;

  @IsEnum(EventCadType)
  type: EventCadType;

  @IsOptional()
  @IsString()
  comment: string;
}

export class CreateEventCadInEventDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsUrl()
  url: string;

  @IsString()
  @Length(3, 100)
  name: string;
}
