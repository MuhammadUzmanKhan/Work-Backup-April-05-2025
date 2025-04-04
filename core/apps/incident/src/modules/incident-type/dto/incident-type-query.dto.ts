import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import {
  CsvOrPdfDto,
  DateFilterDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import { IncidentPriorityApi } from '@ontrack-tech-group/common/constants';

export class IncidentTypeQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  CsvOrPdfDto,
  DateFilterDto,
  PaginationDto,
) {
  @ApiPropertyOptional({ description: 'Pass Name of incident type' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Default Priority must be low, medium, high, critical',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  incident_priority: IncidentPriorityApi;

  @ApiPropertyOptional({
    description: 'Pass true for return only Assigned Incident Type',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_assigned: boolean;

  @ApiPropertyOptional({
    description: 'Default Priority must be low, medium, high, critical',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi, { each: true })
  incident_priorities: IncidentPriorityApi[];

  @ApiPropertyOptional({
    description: 'Pass true for return resolved time in response',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  return_resolved_time: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return only Pinned Incident Type',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  pinned: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to get Top 10 Incident Types For Mobile',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  top_incident_types: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to get Top 10 Incident Types For Web',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  top_sorted: boolean;
}

export class GetIncidentTypeNamesDto {
  @ApiProperty({ description: 'Company Id' })
  @IsNumber()
  @Type(() => Number)
  company_id: number;

  @ApiPropertyOptional({ description: 'Event Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  event_id: number;
}

export class GetAlertIncidentTypesDto extends IntersectionType(
  EventIdQueryDto,
) {
  @ApiPropertyOptional({
    description:
      'Pass true to get Incident Type that has been assigned to user',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  assigned_incident_types: boolean;

  @ApiPropertyOptional({ description: 'User Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  user_id: number;

  @ApiPropertyOptional({
    description:
      'Mention multiple incident_priority: Ex: low, medium like incident_priority=low&incident_priority=medium',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi, { each: true })
  incident_priority!: IncidentPriorityApi[];

  @ApiPropertyOptional({ description: 'Pass Name of incident type' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Pass true to get Event Contact and false for getting users that has been assigned to incident',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  key_contact: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to get Incident Type sorted albhapetically',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  alphabet_sort: boolean;
}
