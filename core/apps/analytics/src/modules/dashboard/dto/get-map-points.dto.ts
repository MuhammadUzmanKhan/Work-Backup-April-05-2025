import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetLegendDataDto } from './get-legend.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EventStatusAPI } from '@ontrack-tech-group/common/constants';

export class GetMapPointsDto extends GetLegendDataDto {
  @ApiPropertyOptional({
    description:
      'Show Events according to selected status, status can be: upcoming, in_progress, completed, on_hold',
  })
  @IsOptional()
  @IsEnum(EventStatusAPI)
  event_status: EventStatusAPI;
}
