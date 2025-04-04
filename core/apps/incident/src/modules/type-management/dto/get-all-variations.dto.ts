import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyIdDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IncidentTypeSortingColumns } from '@Common/constants';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { Type } from 'class-transformer';

export class GetAllVariantsDto extends IntersectionType(
  PaginationDto,
  CompanyIdDto,
) {
  @ApiPropertyOptional({
    description: 'Pass "variable" | "name" to sort on',
    enum: IncidentTypeSortingColumns,
  })
  @IsOptional()
  @Type(() => String)
  @IsEnum(IncidentTypeSortingColumns)
  sort_column: IncidentTypeSortingColumns;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC', enum: SortBy })
  @IsOptional()
  @Type(() => String)
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}
