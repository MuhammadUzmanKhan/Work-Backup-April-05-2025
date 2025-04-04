import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from '../../database/models/notifications.models';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.notificationModel.create(
      createNotificationDto,
    );
    return notification;
  }

  async markAsRead(notificationId: number): Promise<{ message: string }> {
    const notification = await this.notificationModel.findByPk(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.read = true;
    await notification.save();
    return { message: 'Notification marked as read successfully' };
  }
  async countReadNotifications(userId: number): Promise<number> {
    return this.notificationModel.count({
      where: {
        userId,
        read: true,
      },
    });
  }

  async countUnreadNotifications(userId: number): Promise<number> {
    return this.notificationModel.count({
      where: {
        userId,
        read: false,
      },
    });
  }
}
