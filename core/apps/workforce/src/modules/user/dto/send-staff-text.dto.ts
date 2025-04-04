import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SendStaffText extends EventIdQueryDto {
  @IsNumber()
  @Type(() => Number)
  user_id: number;
}
