import { Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsString, Max } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateScanCountDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Max(99999999)
  logged_count: number;

  @IsString()
  @IsISO8601()
  logged_time: Date;
}
