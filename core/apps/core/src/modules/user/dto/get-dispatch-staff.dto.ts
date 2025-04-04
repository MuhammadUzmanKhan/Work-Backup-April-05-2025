import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  DispatchUsersSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';

export class DispatchStaffUsersDto extends IntersectionType(PaginationDto) {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @ApiPropertyOptional({
    description: 'Department ids array',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  department_ids: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ enum: DispatchUsersSortingColumns })
  @IsOptional()
  @IsEnum(DispatchUsersSortingColumns)
  sort_column: DispatchUsersSortingColumns;

  @ApiPropertyOptional({ enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
