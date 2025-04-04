import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisibleStatus } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateMobileIncidentInboxDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass name of Mobile Inbox' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({ description: 'Pass phone number' })
  @IsOptional()
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
