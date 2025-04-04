import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CloneDto } from '@Common/dto';
import { ApiProperty } from '@nestjs/swagger';

export class CloneIncidentZoneDto extends CloneDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  copy_main_zones: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  copy_sub_zone: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  copy_camera_zones: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  copy_all_zones: boolean;
}
