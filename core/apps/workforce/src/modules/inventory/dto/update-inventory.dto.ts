import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { EventIdQueryOptionalDto } from '@ontrack-tech-group/common/dto';

export class UpdateInventoryDto extends EventIdQueryOptionalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Designation should not be empty' })
  designation: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Location Description should not be empty' })
  location_description: string;

  @IsOptional()
  @IsString()
  uid: string;

  @IsOptional()
  @IsString()
  unique_code: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inventory_type_id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  department_id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fuel_type_id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inventory_zone_id: number;
}
