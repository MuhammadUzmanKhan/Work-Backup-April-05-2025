import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { RegionIdDto } from '@ontrack-tech-group/common/dto';
import { Continents } from '@ontrack-tech-group/common/constants';
import { PaginationAndKeywordDto } from '@Common/dto';

export class DashboardDropdownsQueryDto extends IntersectionType(
  PaginationAndKeywordDto,
  RegionIdDto,
) {
  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiPropertyOptional({
    description:
      'Region/continents of the world. Like "North America", "South America", "Europe", "Asia", "Africa", "Australia", "Antarctica"',
  })
  @IsOptional()
  @IsEnum(Continents)
  region: Continents;

  @ApiPropertyOptional({ description: 'Selected Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  selected_id: number;

  @ApiPropertyOptional({
    description:
      'If you want to get event names for all events without pagination, then pass true.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  without_pagination: boolean;
}
