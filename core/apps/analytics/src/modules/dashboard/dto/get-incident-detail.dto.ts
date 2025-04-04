import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class IncidentDetailDto {
  @ApiProperty({ description: 'Incident Id' })
  @Type(() => Number)
  @IsNumber()
  incident_id: number;
}
