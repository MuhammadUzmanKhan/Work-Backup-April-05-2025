import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetIncidentCountMobileDto extends IntersectionType(
  EventIdQueryDto,
) {
  @ApiPropertyOptional({
    description: 'Pass true for created or dispatched by current user',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  created_or_dispatched_by_current_user!: boolean;

  @ApiPropertyOptional({
    description: 'Pass department ids to get incident of reported department',
  })
  @IsOptional()
  @Type(() => Number)
  department_ids!: number[];
}
