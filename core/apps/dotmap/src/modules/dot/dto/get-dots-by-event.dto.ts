import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  DateMultipleFilterDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';
import { DotsGroupBy } from '@Common/constants/enums';

export class GetDotsByEventDto extends IntersectionType(
  EventIdQueryDto,
  DateMultipleFilterDto,
) {
  @ApiPropertyOptional({
    description:
      'Mention multiple values like vendor_ids=1&vendor_ids=2 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  vendor_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like area_ids=1&area_ids=2 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  area_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like position_ids=1&position_ids=2 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  position_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like position_name_ids=1&position_name_ids=2 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  position_name_ids?: number[];

  @ApiPropertyOptional({
    description:
      'Mention multiple values like shift_ids=1&shift_ids=2 in query params',
  })
  @IsOptional()
  @Type(() => Number)
  shift_ids?: number[];

  @ApiPropertyOptional({
    description:
      'To search through vendor, position, position name, position Id, area',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Pass true to return only dots with priority',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  priority?: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to return only placed dots',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  placed?: boolean;

  @ApiPropertyOptional({
    description: 'Pass true to return only missing dots',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  missing?: boolean;

  @ApiProperty({
    description: 'Group by area or position',
    enum: DotsGroupBy,
  })
  @IsEnum(DotsGroupBy)
  group_by: DotsGroupBy;
}
