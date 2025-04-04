import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import {
  EventSortingForMultipleStatus,
  SortBy,
} from '@ontrack-tech-group/common/constants';

export class EventMultipleStatusQueryParams extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EventSortingForMultipleStatus)
  sort_column: EventSortingForMultipleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
