import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class SourceQueryParamsDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass Name of Source' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pass is_assigned true if fetch only assigned sources',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_assigned: boolean;
}
