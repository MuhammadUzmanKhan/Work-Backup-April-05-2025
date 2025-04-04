import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { UserStatuses } from '@ontrack-tech-group/common/constants';

export class UpdateBulkUserStatusDto extends EventIdQueryDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];

  @IsEnum(UserStatuses)
  status: UserStatuses;
}

export class UpdateUserStatusDto extends EventIdQueryDto {
  @IsEnum(UserStatuses)
  status: UserStatuses;
}
