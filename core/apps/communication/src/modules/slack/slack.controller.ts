import { Observable, of } from 'rxjs';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { SlackService } from './slack.service';

@ApiTags('Slack')
@ApiBearerAuth()
@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @MessagePattern('slack-event-update')
  async postEventUpdate(slackEventUpdate: any): Promise<Observable<any>> {
    try {
      const decryptedSlackEventUpdateBody: string = decryptData(
        slackEventUpdate['body'],
      );

      const slackUpdate = await this.slackService.postEventUpdate(
        decryptedSlackEventUpdateBody['text'],
      );

      return of(slackUpdate);
    } catch (error) {
      return of(error.response);
    }
  }
}
