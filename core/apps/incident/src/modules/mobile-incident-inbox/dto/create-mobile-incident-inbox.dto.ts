import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { VisibleStatus } from '@ontrack-tech-group/common/constants';

export class CreateMobileIncidentInboxDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Pass name of Mobile Inbox' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pass phone number' })
  @IsString()
  phone_number: string;

  @ApiPropertyOptional({ description: 'Country code' })
  @IsOptional()
  @IsString()
  country_code: string;

  @ApiPropertyOptional({ description: 'Country iso code' })
  @IsOptional()
  @IsString()
  country_iso_code: string;

  @ApiPropertyOptional({ description: 'Pass value type: hide or show' })
  @IsOptional()
  @IsEnum(VisibleStatus)
  visible_status: VisibleStatus;
}
