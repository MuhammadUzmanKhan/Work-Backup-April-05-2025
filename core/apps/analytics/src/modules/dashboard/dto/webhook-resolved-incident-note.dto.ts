import { IsBoolean, IsNumber } from 'class-validator';

export class WebhookResolvedIncidentNoteDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  is_new_resolved_note: boolean;
}
