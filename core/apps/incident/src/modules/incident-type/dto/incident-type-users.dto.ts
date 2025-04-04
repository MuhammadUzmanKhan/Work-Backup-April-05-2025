import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { GetAllEventContactSortingColumns } from '@Common/constants';

export class GetIncidentTypeUsersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Incident Type Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  incident_type_id: number;

  @ApiPropertyOptional({ description: 'Event Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  event_id: number;

  @ApiPropertyOptional({ description: 'Pass Name of incident type' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'Sort Column By name, email and cell for users and contact_name, contact_email, contact_phone and title for event users',
  })
  @IsOptional()
  @IsEnum(GetAllEventContactSortingColumns)
  sort_column: GetAllEventContactSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description:
      'Pass true to get assigned incident type and false for un-assigned',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  department_users: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to get all key contact and department users',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all_users: boolean;

  @ApiPropertyOptional({ description: 'Department Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id: number;
}
