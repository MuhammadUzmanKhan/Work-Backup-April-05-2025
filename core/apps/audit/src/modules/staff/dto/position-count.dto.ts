import { IntersectionType } from '@nestjs/swagger';
import { DatesQueryDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { DateFilterDto } from '@Common/dto';

export class PositionCountDto extends IntersectionType(
  EventIdQueryDto,
  DateFilterDto,
  DatesQueryDto,
) {}
