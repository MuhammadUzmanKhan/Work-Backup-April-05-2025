import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatusAPI } from '@ontrack-tech-group/common/constants';

export class GetLinkedEventsDto {
  @ApiProperty({ description: 'Twilio Number ID', example: 123 })
  @IsNumber()
  @Type(() => Number)
  twilio_number_id: number;

  @ApiPropertyOptional({
    description: 'Event status to filter',
    enum: EventStatusAPI,
  })
  @IsOptional()
  @IsEnum(EventStatusAPI)
  status: EventStatusAPI;
}
