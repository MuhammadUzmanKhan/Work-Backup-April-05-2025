import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetIncidentTypeIncidentsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {
  @ApiPropertyOptional({ description: 'Incident Type Id' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  incident_type_id: number;
}
