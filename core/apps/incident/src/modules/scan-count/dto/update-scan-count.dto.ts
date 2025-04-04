import { Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateScanCountDto extends EventIdQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  logged_count: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsISO8601()
  logged_time: Date;
}
