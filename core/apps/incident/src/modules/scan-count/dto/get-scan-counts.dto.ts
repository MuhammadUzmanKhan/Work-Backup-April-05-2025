import { IsISO8601, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllScanCounts extends IntersectionType(
  EventIdQueryDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsISO8601()
  logged_time: string;
}
