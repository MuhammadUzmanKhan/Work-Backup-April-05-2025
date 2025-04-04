import { IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class IncidentDashboardReportOverviewDto extends EventIdQueryDto {
  @IsString()
  image_url!: string;
}
