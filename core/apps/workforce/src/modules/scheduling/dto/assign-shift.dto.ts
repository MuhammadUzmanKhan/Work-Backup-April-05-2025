import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class AssignShiftToStaffScheduleDto extends IntersectionType(
  EventIdQueryDto,
) {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'Pass a proper datetime format' })
  @IsString()
  shift_start_time: string;

  @ApiProperty({ description: 'Pass a proper datetime format' })
  @IsString()
  shift_end_time: string;
}
