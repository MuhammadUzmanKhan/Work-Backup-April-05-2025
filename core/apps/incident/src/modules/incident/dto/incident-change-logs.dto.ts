import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  ChangelogsChangeColumn,
  ChangelogsSortColumn,
} from '@Common/constants';

export class IncidentChangelogQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {
  @ApiPropertyOptional({
    description: 'Search by formatted_log_text',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order!: SortBy;

  @ApiPropertyOptional({
    description: 'Pass created_at, editor_name',
  })
  @IsOptional()
  @IsEnum(ChangelogsSortColumn)
  sort_column!: ChangelogsSortColumn;

  @ApiPropertyOptional({
    description: 'Pass status',
  })
  @IsOptional()
  @IsEnum(ChangelogsChangeColumn)
  change_column!: ChangelogsChangeColumn;
}
