import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  SortBy,
  UsersIncidentSortingColumns,
  UsersSortingColumns,
} from '@ontrack-tech-group/common/constants';
import {
  CsvOrPdfDto,
  PdfDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';

export class EventUsersQueryParamsDto extends IntersectionType(
  PaginationDto,
  CsvOrPdfDto,
) {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  division_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  // TODO:  this will be removed
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status: string;

  @ApiPropertyOptional({ enum: UsersSortingColumns })
  @IsOptional()
  @IsEnum(UsersSortingColumns)
  sort_column: UsersSortingColumns;

  @ApiPropertyOptional({ enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description:
      'If you want to get the assign users to event then send true and if want to get the total staff against event that are assign and un-assign then send false',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  eventUsers: boolean;

  @ApiPropertyOptional({
    description: 'If you want to get User Search on Limited Filter send true',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  messageUsers: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  current_department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  current_division_id: number;

  @ApiPropertyOptional({
    description:
      'If you want to get the users who are not assigned to any division',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  na_division: boolean;

  @ApiPropertyOptional({
    description: 'Division ids array',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  division_ids: number[];

  @ApiPropertyOptional({
    description: 'Department ids array',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  department_ids: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  reference_user: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  available_staff: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  dispatch_listing: boolean;
}

export class AllUsersQueryParamsDto extends IntersectionType(
  PaginationDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UsersSortingColumns)
  sort_column: UsersSortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  reference_user: boolean;
}

export class StaffDetailQueryParamsDto extends IntersectionType(
  PdfDto,
  EventIdQueryDto,
) {}

export class UsersLocationDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Department Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;
}

export class UserEventsChangeLogsDto extends PaginationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;
}

export class EventUserDto extends EventIdQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  // For getting all users without role check
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all_roles: boolean;

  // For getting all global roles
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  global_roles: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  incident_division_id: number;
}

export class EventUserMentionDto extends EventIdQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}

export class IncidentStaffDto extends OmitType(EventUsersQueryParamsDto, [
  'dispatch_listing',
  'available_staff',
  'reference_user',
  'user_id',
  'na_division',
  'current_division_id',
  'current_department_id',
  'department_id',
  'division_id',
  'status',
  'csv_pdf',
  'file_name',
  'eventUsers',
  'messageUsers',
  'sort_column',
] as const) {
  @ApiPropertyOptional({ enum: UsersIncidentSortingColumns })
  @IsOptional()
  @IsEnum(UsersIncidentSortingColumns)
  sort_column: UsersIncidentSortingColumns;
}
