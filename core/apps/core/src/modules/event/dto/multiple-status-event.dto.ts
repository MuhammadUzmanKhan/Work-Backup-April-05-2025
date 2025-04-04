import { MultipleEventStatusAPI } from '@ontrack-tech-group/common/constants';
import { ArrayMinSize, IsEnum } from 'class-validator';

export class EventMultipleStatusBodyData {
  @ArrayMinSize(1)
  @IsEnum(MultipleEventStatusAPI, { each: true })
  statuses: MultipleEventStatusAPI[];
}
