import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { EventCadType } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateEventCadDto extends EventIdQueryDto {
  @IsEnum(EventCadType)
  type: EventCadType;

  @IsNumber()
  version: number;

  @IsOptional()
  @IsString()
  comment: string;

  @IsOptional()
  @IsUrl()
  url: string;

  @IsOptional()
  @Length(3, 100)
  @IsString()
  name: string;
}
