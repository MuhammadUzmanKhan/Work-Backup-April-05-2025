import { IsNumber } from 'class-validator';
import { CreateIncidentZoneDto } from '.';

export class CreateIncidentSubZoneDto extends CreateIncidentZoneDto {
  @IsNumber()
  parent_id: number;
}
