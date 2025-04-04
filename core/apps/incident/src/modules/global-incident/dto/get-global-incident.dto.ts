import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';

export class GetGlobalIncidentDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {
  @ApiPropertyOptional({
    description: 'Search by incident type name and description',
  })
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pass true to get archived incident Conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  archived: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return pinnded conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  pinned: boolean;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
