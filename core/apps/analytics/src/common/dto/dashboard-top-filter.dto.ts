import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { DashboardTopFilter } from '@Common/constants';

export class DashboardTopFilterOptionalDto {
  @ApiPropertyOptional({
    description:
      'Filter of parent companies, sub companies, global or events. Values can be "Parent"(universal view), "Child"(universal view), "Global"(only for global view), "Event"(For all views) ',
  })
  @IsOptional()
  @IsEnum(DashboardTopFilter)
  dashboard_top_filter: DashboardTopFilter;

  @ApiPropertyOptional({
    description:
      'Include subcompanies with parent (should be false when Child is selected as filter)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  include_subcompanies: boolean;
}

export class DashboardTopFilterRequiredDto {
  @ApiProperty({
    description:
      'Filter of parent companies, sub companies, global or events. Values can be "Parent"(universal view), "Child"(universal view), "Global"(only for global view), "Event"(For all views) ',
  })
  @IsEnum(DashboardTopFilter)
  dashboard_top_filter: DashboardTopFilter;

  @ApiPropertyOptional({
    description:
      'Include subcompanies with parent (should be false when Child is selected as filter)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  include_subcompanies: boolean;
}
