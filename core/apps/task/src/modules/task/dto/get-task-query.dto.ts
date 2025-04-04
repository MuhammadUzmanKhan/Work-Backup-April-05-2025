import { IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PdfDto } from '@ontrack-tech-group/common/dto';

export class GetTaskQueryParamsDto extends IntersectionType(
  EventIdQueryDto,
  PdfDto,
) {}
