import { IntersectionType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EventIdQueryDto, PdfDto } from '@ontrack-tech-group/common/dto';

export class DashboardPdfDto extends IntersectionType(EventIdQueryDto, PdfDto) {
  @IsString()
  image_url!: string;
}
