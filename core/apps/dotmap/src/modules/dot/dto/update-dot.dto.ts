import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from './';

export class UpdateShiftDto {
  @IsOptional()
  @IsNumber()
  dot_shift_id?: number;

  @IsNumber()
  @Min(1)
  rate: number;

  @IsNumber()
  shift_id: number;

  @IsNumber()
  @Min(1)
  staff: number;
}

export class UpdateDotDto {
  @IsOptional()
  @IsNumber()
  vendor_id: number;

  @IsOptional()
  @IsNumber()
  area_id: number;

  @IsOptional()
  @IsNumber()
  position_id: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Position Name should not be empty' })
  position_name: string;

  @IsOptional()
  @IsBoolean()
  priority: boolean;

  @IsOptional()
  @IsBoolean()
  missing: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateShiftDto)
  shifts: UpdateShiftDto[];
}

export class UpdateBulkDotsDto extends UpdateDotDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  dot_ids: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'Dates should not be empty' })
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date is not valid or not in the correct format yyyy-mm-dd',
    each: true,
  })
  dates: string[];
}
