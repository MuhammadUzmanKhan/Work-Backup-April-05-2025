import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsISO8601,
  IsNotEmpty,
  ArrayUnique,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

class StaffDto {
  @IsNotEmpty()
  @IsString()
  position!: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  pos!: string;

  @IsNumber()
  rate!: number;
}

export class ReUploadStaffAndShiftDto {
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
  @ArrayUnique({ message: 'Recursive array should have unique dates' })
  @IsString({ each: true })
  recursive!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffDto)
  staff!: StaffDto[];
}

export class ReuploadStaffDto extends EventIdQueryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReUploadStaffAndShiftDto)
  csv_data!: ReUploadStaffAndShiftDto[];

  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;

  @IsOptional()
  @IsUrl()
  @IsNotEmpty({ message: 'URL should not be empty' })
  url!: string;

  @ValidateIf((obj) => !!obj.url)
  @IsString()
  @IsNotEmpty({ message: 'File Name should not be empty' })
  file_name!: string;
}
