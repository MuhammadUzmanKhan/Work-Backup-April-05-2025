import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateIncidentMessageCenterDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Pass name of message center' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pass phone number' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' }) // Ensures it's not an empty string
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
