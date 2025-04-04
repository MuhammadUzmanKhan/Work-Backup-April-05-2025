import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CsvOrPdfDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';

export class GetIncidentDivisionDto extends IntersectionType(
  PaginationDto,
  CsvOrPdfDto,
  EventIdQueryDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  division_id: number;
}

export class GetDivisionNamesByEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}
