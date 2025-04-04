import {
  DateFilterDto,
  DatesQueryDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';
import { IntersectionType } from '@nestjs/swagger';
import { PriorityDto } from '@Common/dto';

export class AttendanceAuditDto extends IntersectionType(
  EventIdQueryDto,
  DatesQueryDto,
  DateFilterDto,
  PriorityDto,
) {}
