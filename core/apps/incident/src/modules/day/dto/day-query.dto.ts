import { IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class DayQueryParamsDto extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {}
