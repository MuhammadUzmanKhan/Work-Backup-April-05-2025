import { GetAllEventContactSortingColumns } from '@Common/constants/constants';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AlertableType, SortBy } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class AvailableKeyContactDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiPropertyOptional({
    description: 'Pass IncidentType, PriorityGuide or All',
    enum: AlertableType,
  })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiPropertyOptional({
    description: 'Ids of IncidentType or PriorityGuide',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  alertable_ids: number[];

  @ApiPropertyOptional({ description: 'Priority Guide Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority_guide_id: number;

  @ApiPropertyOptional({
    description: 'Search by first_name, last_name or company name',
  })
  @IsOptional()
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

  @ApiPropertyOptional({ description: 'Sort Column By title' })
  @IsOptional()
  @IsEnum(GetAllEventContactSortingColumns)
  sort_column: GetAllEventContactSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({ description: 'Incident Type Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_type_id: number;
}
