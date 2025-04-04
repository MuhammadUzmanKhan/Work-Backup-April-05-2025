import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { GetAllEventContactSortingColumns } from '@Common/constants/constants';

export class GetAllPriorityGuideDto extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name, phone number and email',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Department Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id: number;

  @ApiPropertyOptional({ description: 'Sort Column By name and phone' })
  @IsOptional()
  @IsEnum(GetAllEventContactSortingColumns)
  sort_column: GetAllEventContactSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
