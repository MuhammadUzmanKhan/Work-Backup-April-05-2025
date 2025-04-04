import { IsNumber } from 'class-validator';

export class UserStatusWebhookDto {
  @IsNumber()
  user_id: number;
}
