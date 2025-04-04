import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notifications } from 'src/common/models/notifications.model';
import { Op } from 'sequelize';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { notificationsMessages } from 'src/common/constants/messages';

@Injectable()
export class NotificationsService {
    constructor() { }

    public async createNotification(createNotificationDto: CreateNotificationDto): Promise<{ success: boolean, notification: Notifications }> {
        const { title, notice, callToAction, startDate, endDate } = createNotificationDto;

        const notification = await Notifications.create({
            title,
            notice,
            callToAction,
            startDate,
            endDate
        });
        if (!notification) throw new InternalServerErrorException();

        return {
            success: true,
            notification
        }
    }

    public async getActiveNotifications(): Promise<Notifications[]> {
        const currentDate = new Date().toISOString();

        const activeNotifications = await Notifications.findAll({
            where: {
                startDate: {
                    [Op.lte]: currentDate,
                },
                endDate: {
                    [Op.gte]: currentDate,
                },
            }
        });
        if (!activeNotifications) throw new InternalServerErrorException();

        return activeNotifications
    }

    public async getAllNotifications(): Promise<Notifications[]> {

        const notifications = await Notifications.findAll();
        if (!notifications) throw new InternalServerErrorException();

        return notifications
    }

    public async findOne(id: string): Promise<Notifications> {
        const notification = await Notifications.findByPk(id);
        if (!notification) {
            throw new NotFoundException(notificationsMessages.findNotficiationByIdNotFound);
        }
        return notification;
    }

    public async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notifications> {
        const notification = await this.findOne(id);

        notification.title = updateNotificationDto.title || notification.title;
        notification.notice = updateNotificationDto.notice || notification.notice;
        notification.callToAction = updateNotificationDto.callToAction || notification.callToAction;
        notification.startDate = updateNotificationDto.startDate || notification.startDate;
        notification.endDate = updateNotificationDto.endDate || notification.endDate;

        await notification.save();
        return notification;
    }

    async deleteNotification(id: string): Promise<void> {
        const notification = await this.findOne(id);
        await notification.destroy();
    }
}
