import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Location } from './create-cad.dto';

export class UpdateCadDto extends EventIdQueryDto {
  @IsOptional()
  @IsNumber()
  cad_type_id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsUrl()
  image_url: string;

  @IsOptional()
  @IsString()
  image_name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Location)
  location: Location;
}
