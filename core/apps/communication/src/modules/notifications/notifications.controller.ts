import { Observable, of } from 'rxjs';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern('send-push-notification')
  async sendPushNotification(
    pushNotificationDto: any,
  ): Promise<Observable<any>> {
    try {
      const decryptedNotificationBody: any = decryptData(
        pushNotificationDto.body,
      );

      const pushNotification =
        await this.notificationsService.sendPushNotification(
          decryptedNotificationBody,
        );

      return of(pushNotification);
    } catch (error) {
      return of(error.response);
    }
  }
}
