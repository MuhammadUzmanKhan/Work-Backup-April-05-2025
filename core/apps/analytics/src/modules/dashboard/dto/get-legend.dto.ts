import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { RegionIdDto } from '@ontrack-tech-group/common/dto';
import { Continents } from '@ontrack-tech-group/common/constants';
import { DashboardTopFilterOptionalDto } from '@Common/dto';

export class GetLegendDataDto extends IntersectionType(
  DashboardTopFilterOptionalDto,
  RegionIdDto,
) {
  @ApiPropertyOptional({
    description:
      'Event Id should only pass when "Event" is passed in dashboard_top_filter',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  event_id: number;

  @ApiPropertyOptional({
    description:
      'Company Id should only pass in case of "Parent"(universal view), "Child"(universal view), "Global"(only global view) filter passed in dashboard_top_filter.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id: number;

  @ApiPropertyOptional({ description: 'Year i.e 2023' })
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
}
