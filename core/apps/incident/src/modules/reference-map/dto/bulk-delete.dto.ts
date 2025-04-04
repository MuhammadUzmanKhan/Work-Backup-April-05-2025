import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BulkDeleteUpdateReferenceMapDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber({}, { each: true })
  reference_map_ids: number[];

  @ApiPropertyOptional({ description: 'Pass Current Version to True of False' })
  @IsOptional()
  @IsBoolean()
  current_version: boolean;
}
