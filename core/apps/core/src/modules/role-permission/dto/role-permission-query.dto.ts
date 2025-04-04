import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  PermissionModules,
  PermissionSortingColumns,
  RoleSortingColumns,
} from '@Common/constants';

export class PermissionQueryParams extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'module can be: event, company, user_company, task, task_category, task_list, task_subtask, incident, incident_type, incident_division, incident_zone, source, priority_guide, alert, filter, fuel_type, incident_message_center, mobile_incident_inbox, preset_message, reference_map, scan, department, inventory, inventory_type, inventory_type_category, inventory_zone, point_of_interest, point_of_interest_type, scheduling, user, dashboard',
  })
  @IsOptional()
  @IsEnum(PermissionModules)
  module: PermissionModules;

  @ApiPropertyOptional({
    description: 'sort_column can be: name, type, role_count',
  })
  @IsOptional()
  @IsEnum(PermissionSortingColumns)
  sort_column: PermissionSortingColumns;

  @ApiPropertyOptional({
    description: 'order can be: ASC, DESC',
  })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Search a Permission by its name and description',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'If you want to get the assigned permissions of role then send role_id, it will return all permssions along with assigned permissions',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  role_id: number;

  @ApiPropertyOptional({
    description:
      'If you want to get the assigned permissions of role then send true, it will return only assigned permssions',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  self_assigned: boolean;
}

export class RoleQueryParams extends PaginationDto {
  @ApiPropertyOptional({
    description: 'sort_column can be: name, user_count, permission_count',
  })
  @IsOptional()
  @IsEnum(RoleSortingColumns)
  sort_column: RoleSortingColumns;

  @ApiPropertyOptional({
    description: 'order can be: ASC, DESC',
  })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Search a Role by its name and description',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}
