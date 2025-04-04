import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { GetAllEventContactSortingColumns } from '@Common/constants/constants';

export class GetPriorityGuideById extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name and phone number, email',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Sort Column By name and phone' })
  @IsOptional()
  @IsEnum(GetAllEventContactSortingColumns)
  sort_column: GetAllEventContactSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;

  @ApiPropertyOptional({
    description: 'Pass true to get key contact and false for department users',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_key_contact: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to get all key contact and department users',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all_users: boolean;
}
