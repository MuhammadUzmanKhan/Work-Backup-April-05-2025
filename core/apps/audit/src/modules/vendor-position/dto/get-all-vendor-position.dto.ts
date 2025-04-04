import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CompanyIdOptionalDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';
import { PriorityDto } from '@Common/dto';

export class GetAllVendorPositionsDto extends IntersectionType(
  CompanyIdOptionalDto,
  PriorityDto,
) {
  @ApiPropertyOptional({
    description: 'To search through name of vendors positions',
  })
  @IsOptional()
  @IsString()
  keyword!: string;
}

export class GetAllVendorPositionsByEventDto extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'To search through name of vendors positions',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({
    description:
      'To retrieve roles or vendor positions for a selected company or vendor, pass the vendor_id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Ensures the value is transformed to a number
  vendor_id?: number;
}
