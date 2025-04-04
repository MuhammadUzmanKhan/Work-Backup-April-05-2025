import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateShiftScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shift_start_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shift_end_time: string;
}
