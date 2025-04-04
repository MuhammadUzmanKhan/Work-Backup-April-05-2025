import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  IncidentPriorityApi,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { CsvOrPdfDto } from '@ontrack-tech-group/common/dto';

export class ComparisonEventGraphDto {
  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_division_ids=123&incident_division_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_division_ids: number;

  @IsOptional()
  @IsEnum(StatusFilter)
  incident_status: StatusFilter;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_type_ids=123&incident_type_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_type_ids: number;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like department_ids=123&department_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  department_ids: number;

  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  incident_priority: IncidentPriorityApi;

  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'Event Ids should not be empty' })
  event_ids: number[];
}

export class ComparisonEventLineGraphDto extends ComparisonEventGraphDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  day: number;
}

export class ComparisonEventPieGraphDto extends ComparisonEventGraphDto {}

export class ComparisonEventGraphCsvPdfDto extends IntersectionType(
  ComparisonEventGraphDto,
  CsvOrPdfDto,
) {}

export class ComparisonEventGraphPdfDto extends IntersectionType(
  ComparisonEventLineGraphDto,
  CsvOrPdfDto,
) {}
