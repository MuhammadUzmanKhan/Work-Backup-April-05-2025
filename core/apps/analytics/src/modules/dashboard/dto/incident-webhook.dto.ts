import { IsBoolean, IsNumber } from 'class-validator';

export class IncidentWebhookDto {
  @IsNumber()
  incident_id: number;

  @IsBoolean()
  is_new_incident: boolean;
}
