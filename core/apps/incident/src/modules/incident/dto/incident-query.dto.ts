import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import {
  ImageOrComment,
  IncidentDispatch,
  SortBy,
  SourceType,
  StatusFilter,
  IncidentPriorityApi,
  ResolvedIncidentNoteStatusApi,
  DispatchedStatusFilter,
  IncidentStatusFilter,
} from '@ontrack-tech-group/common/constants';
import {
  DateFilterDto,
  EventIdQueryDto,
  PaginationDto,
} from '@ontrack-tech-group/common/dto';
import { OrderByGroup, SortColumn } from '@Common/constants';

export class IncidentQueryParamsForMapDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
  DateFilterDto,
) {
  @ApiPropertyOptional({
    description:
      'Pass true for fetch all incidents including follow up and resolved as well',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all_statuses!: boolean;
}

export class IncidentGetAPIiOSDto {
  @ApiPropertyOptional({
    description: 'Pass comma separated: Ex: 1,2,3',
  })
  @IsOptional()
  @Type(() => String)
  multiple_divisions_filter!: string;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like multiple_incident_type_filter=123,21,3 in query params',
  })
  @IsOptional()
  @Type(() => String)
  multiple_incident_type_filter!: string;

  @ApiPropertyOptional({
    description:
      'Pass comma separated priorities: Ex: low,normal,important,critical',
  })
  @IsOptional()
  @Type(() => String)
  multiple_priorities_filter!: string;

  @ApiPropertyOptional({
    description:
      'Mention multiple zone values like zone_ids=12,11,311 in query params',
  })
  @IsOptional()
  @Type(() => String)
  zone_ids!: string;

  @ApiPropertyOptional({
    description:
      'Pass comma separated: Ex: open, dispatched, resolved, archived, follow_up, in_route, at_scene, responding',
  })
  @IsOptional()
  @Type(() => String)
  multiple_statuses_filter!: string;

  @ApiPropertyOptional({
    description: 'Pass true for created or dispatched by current user',
  })
  @IsOptional()
  @Type(() => Boolean)
  created_or_dispatched_by_current_user!: boolean;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_division_id=123&incident_division_id=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_division_id!: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like type_filter=accident&type_filter=blast in query params',
  })
  @IsOptional()
  @Type(() => String)
  type_filter!: string;

  @ApiPropertyOptional({
    description: 'Pass department ids to get incident of reported department',
  })
  @IsOptional()
  @Type(() => Number)
  department_ids!: number[];
}

export class IncidentQueryParamsDto extends IntersectionType(
  PaginationDto,
  DateFilterDto,
  IncidentGetAPIiOSDto,
) {
  @ApiPropertyOptional({
    description: 'Company Id',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Company id must be a number' })
  @Type(() => Number)
  company_id!: number;

  @ApiPropertyOptional({
    description: 'Event Id',
  })
  @ValidateIf((obj) => !obj.is_legal)
  @IsNumber({}, { message: 'Event Id must be a number' })
  @Min(1, { message: 'Event Id must be greater than 0' })
  @Type(() => Number)
  event_id!: number;

  @ApiPropertyOptional({
    description:
      'Search by description, locator code, staff name, incident type and id',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ description: 'Department/Reporter Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id!: number;

  @ApiPropertyOptional({
    description: 'Incident Id to get filtered linked incidents',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_id!: number;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_zone_id=123&incident_zone_id=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_zone_id!: number[];

  @ApiPropertyOptional({ description: 'Pass created by Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  created_by_id!: number;

  @ApiPropertyOptional({ description: 'Source Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  source_id!: number;

  @ApiPropertyOptional({
    description: 'Select source type like fe, mobile, attendee',
  })
  @IsOptional()
  @IsEnum(SourceType)
  source_type!: SourceType;

  @ApiPropertyOptional({ description: 'Inventory Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventory_id!: number;

  @ApiPropertyOptional({ description: 'User id dispatched to' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dispatched_to_user_id!: number;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_type_id=123&incident_type_id=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_type_id!: number[];

  @ApiPropertyOptional({
    description: 'Pass true for fetch location logged incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  location_logged!: boolean;

  @ApiPropertyOptional({
    description:
      'Mention multiple status: Ex: open, dispatched like status=open&status=dispatched',
  })
  @IsOptional()
  @IsEnum(IncidentStatusFilter, { each: true })
  status!: IncidentStatusFilter[];

  @ApiPropertyOptional({
    description:
      'Mention multiple status: Ex: in_route, archived like dispatched_status=in_route&dispatched_status=archived',
  })
  @IsOptional()
  @IsEnum(DispatchedStatusFilter, { each: true })
  dispatched_status!: DispatchedStatusFilter[];

  @ApiPropertyOptional({
    description: 'Select any filter from "dispatched", "not_dispatched"',
  })
  @IsOptional()
  @IsEnum(IncidentDispatch)
  incident_dispatch!: IncidentDispatch;

  @ApiPropertyOptional({
    description:
      'Mention multiple priorities: Ex: low, medium, high, critical like priorities=low&priorities=high',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi, { each: true })
  priorities!: IncidentPriorityApi[];

  @ApiPropertyOptional({
    description:
      'Mention multiple priorities: Ex: arrest, eviction_ejection, hospital_transport, treated_and_released, resolved_note like resolved_status=arrest&resolved_status=eviction_ejection',
  })
  @IsOptional()
  @IsEnum(ResolvedIncidentNoteStatusApi, { each: true })
  resolved_status!: ResolvedIncidentNoteStatusApi[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_division_ids=123&incident_division_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_division_ids!: number[];

  @ApiPropertyOptional({ description: 'Pass ASC or DESC', enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  order!: SortBy;

  @ApiPropertyOptional({
    description:
      'Pass id, created_at, incident_divisions, incident_type, incident_zone, description, priority, status, dispatch_department_staff, event_name, legal_changed_at',
    enum: SortColumn,
  })
  @IsOptional()
  @IsEnum(SortColumn)
  sort_column!: SortColumn;

  @ApiPropertyOptional({ description: 'Select image/comment filter type' })
  @IsOptional()
  @IsEnum(ImageOrComment)
  has_image_or_comment!: ImageOrComment;

  @ApiPropertyOptional({
    description:
      'Pass priority | status | priority_chronological | status_chronological',
    enum: OrderByGroup,
  })
  @IsOptional()
  @IsEnum(OrderByGroup)
  group!: OrderByGroup;

  @ApiPropertyOptional({
    description:
      'Pass true for fetch all incidents including follow up and resolved as well',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all_statuses!: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to return only incidents without division',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  division_not_available!: boolean;

  @ApiPropertyOptional({
    description: 'Pass end date of the range. Format: YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message:
      'Date is not valid or not in the correct format. The correct format is: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-06-17T12:30:45Z)',
  })
  end_date!: Date;

  @ApiPropertyOptional({
    description: 'Pass end date of the range. Format: YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message:
      'Date is not valid or not in the correct format. The correct format is: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-06-17T12:30:45Z)',
  })
  start_date!: Date;

  @ApiPropertyOptional({
    description: 'This flag is being used for reporting module',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  reporting!: boolean;

  @ApiPropertyOptional({
    description: 'This flag is being used for fetching legal incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_legal!: boolean;

  @ApiPropertyOptional({
    description:
      'This flag is being used for fetching Legal Archived incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_archived!: boolean;

  @ApiPropertyOptional({
    description:
      'This flag is being used for fetching Legal Concluded incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_concluded!: boolean;
}

export class IncidentOverviewStatsQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  DateFilterDto,
  IncidentGetAPIiOSDto,
) {
  @ApiPropertyOptional({
    description:
      'Search Incidents by priority List by providing status like Low/High etc.',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  priority!: IncidentPriorityApi;

  @ApiPropertyOptional({ description: 'Search Incidents by incident_type Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_type_id!: number;

  @ApiPropertyOptional({ description: 'Search Incidents by incidnet_zone Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_zone_id!: number;

  @ApiPropertyOptional({
    description:
      'Search by description, locator code, staff name, incident type and id',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({
    description:
      'Mention multiple values like incident_division_ids=123&incident_division_ids=234 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  incident_division_ids!: number[];

  @ApiPropertyOptional({
    description: 'Select image/comment filter type',
    enum: ImageOrComment,
  })
  @IsOptional()
  @IsEnum(ImageOrComment)
  has_image_or_comment!: ImageOrComment;

  @ApiPropertyOptional({
    description: 'Search Incidents by Status',
    enum: StatusFilter,
  })
  @IsOptional()
  @IsEnum(StatusFilter)
  status!: StatusFilter;

  @ApiPropertyOptional({
    description: 'Pass true for fetch location logged incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  location_logged!: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to return only incidents without division',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  division_not_available!: boolean;

  @ApiPropertyOptional({
    description: 'Pass department ids to get incident of reported department',
  })
  @IsOptional()
  @Type(() => Number)
  department_ids!: number[];

  @ApiPropertyOptional({ description: 'Source Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  source_id!: number;

  @ApiPropertyOptional({ description: 'Inventory Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  inventory_id!: number;

  @ApiPropertyOptional({
    description: 'Pass true for fetch location logged incidents',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  total_hourly_data!: boolean;
}

export class EventNamesQueryParams extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by Event Name' })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiProperty({ description: 'Company Id of selected Event' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id!: number;
}
