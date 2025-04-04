import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { IncidentMessageCenterSortingColumns } from '@Common/constants/constants';

export class GetIncidentMessageCenterDto extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name and phone number',
  })
  @IsOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: 'Sort Column By name and phone' })
  @IsOptional()
  @IsEnum(IncidentMessageCenterSortingColumns)
  sort_column: IncidentMessageCenterSortingColumns;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
