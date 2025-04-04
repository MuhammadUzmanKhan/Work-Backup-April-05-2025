import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventIdQueryOptionalDto } from '@ontrack-tech-group/common/dto';

export class VendorDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Color should not be empty' })
  color: string;
}

export class UpdateVendorsDto extends EventIdQueryOptionalDto {
  @IsArray()
  @ValidateNested()
  @Type(() => VendorDto)
  vendors: VendorDto[];

  @IsNumber()
  company_id: number;
}
