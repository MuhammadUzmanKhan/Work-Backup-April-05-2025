import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { UserCompanyEventSortingColumn } from '@Common/constants';

export class UserCompanyEventQueryParams extends PaginationDto {
  @ApiProperty({ description: 'User Id' })
  @IsNumber()
  @Type(() => Number)
  user_id: number;

  @ApiPropertyOptional({ description: 'Company Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  assigned: boolean;

  @ApiPropertyOptional({
    description:
      'Sorting values can be name, venue_name, start_date, role_name, company_name',
  })
  @IsOptional()
  @IsEnum(UserCompanyEventSortingColumn)
  sort_column: UserCompanyEventSortingColumn;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
