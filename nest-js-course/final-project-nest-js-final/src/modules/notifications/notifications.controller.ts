import {
  Controller,
  Patch,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(+id);
  }
  @Get(':userId/read-count')
  async getReadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationService.countReadNotifications(userId);
    return {
      message: 'Read notifications count retrieved successfully',
      count,
    };
  }

  @Get(':userId/unread-count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationService.countUnreadNotifications(
      userId,
    );
    return {
      message: 'Unread notifications count retrieved successfully',
      count,
    };
  }
}
