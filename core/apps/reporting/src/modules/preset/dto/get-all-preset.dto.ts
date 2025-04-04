import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllPresetDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Preset Name for Search' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Order ASC and DESC',
    enum: SortBy,
  })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
