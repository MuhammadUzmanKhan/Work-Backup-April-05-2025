import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Continents } from '@ontrack-tech-group/common/constants';

export class RegionYearQueryDto {
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
