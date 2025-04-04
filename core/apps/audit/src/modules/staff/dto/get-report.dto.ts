import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import {
  EventIdQueryDto,
  PdfDto,
  DatesQueryDto,
  DateFilterDto,
} from '@ontrack-tech-group/common/dto';

export class DownloadReportDto extends IntersectionType(
  EventIdQueryDto,
  PdfDto,
  DateFilterDto,
  DatesQueryDto,
) {
  @ApiPropertyOptional({
    description: 'Vendor Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;
}
