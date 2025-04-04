import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { AlertableType } from '@ontrack-tech-group/common/constants';

export class CreateAlertDto {
  @ApiProperty({ description: 'Event Id' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty({ description: 'Pass IncidentType or PriorityGuide' })
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiProperty({ description: 'Id of IncidentType or PriorityGuide' })
  @Type(() => Number)
  @IsNumber()
  alertable_id: number;

  @ApiProperty({
    description: 'Array of User Id',
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];

  @ApiProperty({
    description: 'Array of Contact Id',
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  event_contact_ids: number[];

  @ApiPropertyOptional({
    description: 'Pass true for enable email alert',
  })
  @IsOptional()
  @IsBoolean()
  remove_alerts: boolean;
}

export class CreateMultipleAlertDto {
  @ApiProperty({ description: 'Event Id' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty({ description: 'Pass IncidentType or PriorityGuide' })
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiProperty({
    description: 'Ids of IncidentType or PriorityGuide',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  alertable_ids: number[];

  @ApiProperty({
    description: 'Array of User Id',
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];

  @ApiProperty({
    description: 'Array of Contact Id',
  })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  event_contact_ids: number[];
}

export class CreateBulkAlertDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Pass IncidentType, PriorityGuide or All' })
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiProperty({ description: 'User Id' })
  @IsOptional()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'Event Contact Id',
  })
  @IsOptional()
  @IsNumber()
  event_contact_id: number;

  @ApiPropertyOptional({
    description: 'Pass true for enable sms alert',
  })
  @IsOptional()
  @IsBoolean()
  sms_alert: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for enable email alert',
  })
  @IsOptional()
  @IsBoolean()
  email_alert: boolean;
}
