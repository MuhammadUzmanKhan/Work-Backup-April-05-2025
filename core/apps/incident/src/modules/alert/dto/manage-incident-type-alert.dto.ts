import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { AlertableType } from '@ontrack-tech-group/common/constants';

export class ManageIncidentTypeAlertDto extends EventIdQueryDto {
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
}
