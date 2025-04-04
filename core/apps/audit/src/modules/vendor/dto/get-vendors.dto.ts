import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import {
  CompanyIdDto,
  DatesQueryDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';
import { PriorityDto } from '@Common/dto';

import { VendorShiftEnum } from '../helper/enums';

export class GetAllVendorsDto extends IntersectionType(
  CompanyIdDto,
  PriorityDto,
) {
  @ApiPropertyOptional({ description: 'To search through name of vendors.' })
  @IsOptional()
  @IsString()
  keyword!: string;
}

export class GetAllVendorsByShiftAndPositionDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
  PriorityDto,
) {
  @ApiPropertyOptional({
    description: 'To group vendors or positions',
    enum: VendorShiftEnum,
  })
  @IsOptional()
  @IsEnum(VendorShiftEnum)
  group_by!: VendorShiftEnum;
}

export class GetVendorsByPositionDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
) {
  @ApiProperty({
    description: 'search by vendor id',
  })
  @Transform(({ value }) => parseInt(value, 10)) // Convert string to number
  @IsNumber({}, { message: 'Vendor ID must be a valid number.' })
  @Min(1, { message: 'Vendor ID must be greater than 0.' })
  vendor_id!: number;

  @ApiPropertyOptional({
    description: 'search by position id',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10)) // Convert string to number
  @IsNumber({}, { message: 'Position ID must be a valid number.' })
  @Min(1, { message: 'Position ID must be greater than 0.' })
  position_id!: number;
}

export class GetAllVendorsByEventDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'To search through name of vendors.' })
  @IsOptional()
  @IsString()
  keyword!: string;
}
