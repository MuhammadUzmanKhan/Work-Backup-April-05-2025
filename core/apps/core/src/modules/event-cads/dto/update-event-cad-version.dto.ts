import { IsEnum } from 'class-validator';
import { EventCadType } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateEventCadVersionDto extends EventIdQueryDto {
  @IsEnum(EventCadType)
  type: EventCadType;
}
