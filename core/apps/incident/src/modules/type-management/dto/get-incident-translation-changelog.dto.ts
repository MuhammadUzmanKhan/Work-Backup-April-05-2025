import { CompanyIdDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetIncidentTranslationChangelogDto extends IntersectionType(
  CompanyIdDto,
  PaginationDto,
) {
  @ApiPropertyOptional({
    description: 'Incident Type ids array',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_type_ids: number[];

  @ApiPropertyOptional({
    description: 'Sub Company ids array',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  sub_company_ids: number[];
}
