import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateIncidentMessageCenterDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass name of Message Center' })
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
}
