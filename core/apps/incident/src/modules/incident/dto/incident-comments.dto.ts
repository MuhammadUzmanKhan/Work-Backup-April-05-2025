import { IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class IncidentCommentsQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {}
