import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { LiveEventListingColumns } from '@Common/constants';

export class LiveEventListingDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Keyword for search (location, event name, company name)',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description:
      'True in case of operational date and false in case of public date',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  operational: boolean;

  @ApiPropertyOptional({
    description: 'Company Id',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id: number;

  @ApiPropertyOptional({
    description: 'Sort column by name, short_event_location, start_date, time',
  })
  @IsOptional()
  @IsEnum(LiveEventListingColumns)
  sort_column: LiveEventListingColumns;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
