import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { handleError } from '@ontrack-tech-group/common/helpers';

@Injectable()
export class SlackService {
  private slack: any;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Slack API Key
    this.slack = {
      webhookUrl: `https://hooks.slack.com/services/${this.configService.get('SLACK_WORKSPACE_ID')}/${this.configService.get('SLACK_EVENT_UPDATES_CHANNEL_ID')}/${this.configService.get('SLACK_SECRET')}`,
    };
  }

  async postEventUpdate(text: string) {
    try {
      if (this.configService.get('SLACK_UPDATES') === 'true') {
        const env = this.configService.get('ENV');

        const response = await firstValueFrom(
          this.httpService.post(this.slack.webhookUrl, {
            text: env !== 'prod' ? `*[${env}]*\n${text}` : text,
            channel: '#event-updates',
            icon_emoji: ':robot_face:',
          }),
        );

        return response.data;
      } else return { message: 'Slack Updates are Disabled' };
    } catch (error) {
      console.error('Error sending Slack Update:', error);
      handleError(error);
    }
  }
}
