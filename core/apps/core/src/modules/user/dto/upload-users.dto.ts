import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class StaffFilesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @IsString()
  file: string;
}

export class UploadStaffToDeparmentsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffFilesDto)
  files: StaffFilesDto[];
}

export class UploadStaffDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  division_id: number;

  @IsString()
  file: string;
}
