import { IntersectionType } from '@nestjs/swagger';
import { DatesQueryDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllVendorsByDatesDto extends IntersectionType(
  DatesQueryDto,
  EventIdQueryDto,
) {}
