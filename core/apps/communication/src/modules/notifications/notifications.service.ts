import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { handleError } from '@ontrack-tech-group/common/helpers';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendPushNotification(notificationBody: any) {
    if (this.configService.get('PUSH_NOTIFICATIONS') === 'true') {
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${this.configService.get('ONESIGNAL_APP_SECRET')}`,
      };

      try {
        const response = await firstValueFrom(
          this.httpService.post(
            'https://onesignal.com/api/v1/notifications',
            notificationBody.notificationBody,
            { headers },
          ),
        );

        return response.data;
      } catch (error) {
        console.error('Error sending notification:', error);

        handleError(error);
      }
    } else return { message: 'Push Notifications are Disabled' };
  }
}
