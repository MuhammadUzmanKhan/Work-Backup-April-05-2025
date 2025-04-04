import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class ShiftDto {
  @IsNotEmpty()
  @IsString()
  @IsISO8601({ strict: true })
  start_date: string;

  @IsNotEmpty()
  @IsString()
  @IsISO8601({ strict: true })
  end_date: string;

  @IsNumber()
  rate: number;

  @IsNumber()
  quantity: number;
}

export class DotDto {
  @IsString()
  pos_id: string;

  @IsString()
  vendor: string;

  @IsString()
  area: string;

  @IsString()
  position_name: string;

  @IsString()
  position: string;

  @IsBoolean()
  priority: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts: ShiftDto[];
}

export class UploadDotsDto extends EventIdQueryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DotDto)
  dots: DotDto[];

  @IsOptional()
  @IsUrl()
  url: string;

  @ValidateIf((o) => !!o.url)
  @IsString()
  file_name: string;

  @IsBoolean()
  base_deployment: boolean;
}

export class SwapDotsDto extends EventIdQueryDto {
  @IsOptional()
  @IsNumber()
  vendor_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DotDto)
  dots: DotDto[];
}
