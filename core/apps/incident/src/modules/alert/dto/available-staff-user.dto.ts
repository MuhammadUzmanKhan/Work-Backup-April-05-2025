import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { AlertableType, SortBy } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { GetAllEventContactSortingColumns } from '@Common/constants/constants';

export class AvailableStaffUserDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiPropertyOptional({ description: 'Department Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id: number;

  @ApiPropertyOptional({
    description: 'Pass IncidentType, PriorityGuide or All',
    enum: AlertableType,
  })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiPropertyOptional({
    description: 'Id of IncidentType or PriorityGuide',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  alertable_ids: number[];

  @ApiPropertyOptional({
    description: 'Id of PriorityGuide',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority_guide_id: number;

  @ApiPropertyOptional({
    description: 'Search by first_name, last_name or cell number',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Pass true to get assigned incident type and false for un-assigned',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  assigned_incident_types: boolean;

  @ApiPropertyOptional({ description: 'Incident Type Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_type_id: number;

  @ApiPropertyOptional({
    description: 'Sort Column By name, cell, email',
    enum: GetAllEventContactSortingColumns,
  })
  @IsOptional()
  @IsEnum(GetAllEventContactSortingColumns)
  sort_column: GetAllEventContactSortingColumns;

  @ApiPropertyOptional({
    description: 'Order must be ASC or DESC',
    enum: SortBy,
  })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Pass true to get upper roles data only for super admin',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  global_roles: boolean;
}
