import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { AlertableType } from '@ontrack-tech-group/common/constants';

export class RemoveAllAlerts extends IntersectionType(EventIdQueryDto) {
  @ApiProperty({ description: 'Alertable Id' })
  @Type(() => Number)
  @IsNumber()
  alertable_id: number;
}

export class DeleteStaffAlert extends IntersectionType(EventIdQueryDto) {
  @ApiPropertyOptional({
    description: 'Pass IncidentType, PriorityGuide',
    enum: AlertableType,
  })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;

  @ApiPropertyOptional({
    description:
      'Pass true to get assigned incident type and false for un-assigned',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  is_key_contact: boolean;
}
