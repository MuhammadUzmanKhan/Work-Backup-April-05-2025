import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CompanySortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetCompanyDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CompanySortingColumns)
  sort_column: CompanySortingColumns;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
