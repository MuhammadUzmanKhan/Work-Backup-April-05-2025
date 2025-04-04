import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LinkEventTwilioNumberDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  inbox_name: string;

  @IsNumber()
  @Min(1, { message: 'Twilio Number Id must be greater than 0' })
  @Type(() => Number)
  twilio_number_id: number;
}
