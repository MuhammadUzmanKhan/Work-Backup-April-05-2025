import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsISO8601,
  IsNotEmpty,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

class StaffDto {
  @IsNotEmpty()
  @IsString()
  vendor!: string;

  @IsNotEmpty()
  @IsString()
  position!: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  pos!: string;

  @IsNumber()
  rate!: number;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  first_name!: string;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  last_name!: string;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  cell!: string;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  country_code!: string;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  country_iso_code!: string;

  // @IsNotEmpty()
  @IsOptional()
  @IsString()
  contact_email!: string;
}

export class StaffAndShiftDto {
  @IsNotEmpty()
  @IsString()
  @IsISO8601({ strict: true })
  start_date!: string;

  @IsNotEmpty()
  @IsString()
  @IsISO8601({ strict: true })
  end_date!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recursive!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffDto)
  staff!: StaffDto[];
}

export class UploadCsvDto extends EventIdQueryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAndShiftDto)
  csv_data!: StaffAndShiftDto[];

  @IsOptional()
  @IsUrl()
  @IsNotEmpty({ message: 'URL should not be empty' })
  url!: string;

  @ValidateIf((obj) => !!obj.url)
  @IsString()
  @IsNotEmpty({ message: 'File Name should not be empty' })
  file_name!: string;
}
