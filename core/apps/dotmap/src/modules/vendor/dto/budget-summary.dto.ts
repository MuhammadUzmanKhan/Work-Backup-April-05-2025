import { IntersectionType } from '@nestjs/swagger';
import {
  DateMultipleFilterDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';

export class BudgetSummaryDto extends IntersectionType(
  DateMultipleFilterDto,
  EventIdQueryDto,
) {}
