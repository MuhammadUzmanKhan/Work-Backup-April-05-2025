import { Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notifications } from 'src/common/models/notifications.model';
import { Op } from 'sequelize';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { notificationsMessages } from 'src/common/constants/messages';
import { MAINTENANCE } from 'src/common/constants/exceptions';

@Injectable()
export class NotificationsService {
    constructor() { }

    public async createNotification(createNotificationDto: CreateNotificationDto): Promise<{ success: boolean, notification: Notifications }> {
        const { title, notice, callToAction, startDate, endDate, visibleOnExtension, visibleOnWeb } = createNotificationDto;

        const notification = await Notifications.create({
            title,
            notice,
            callToAction,
            startDate,
            endDate,
            visibleOnWeb,
            visibleOnExtension,
        });
        if (!notification) throw new InternalServerErrorException();

        return {
            success: true,
            notification
        }
    }

    public async isMaintenanceModeOn(): Promise<boolean> {
        return !!(await Notifications.findOne({
            where: {
                maintenanceMode: true,
                endDate: {
                    [Op.lt]: new Date(),
                },
            },
        }))
    }

    public async getActiveNotifications(): Promise<Notifications[]> {
        const currentDate = new Date().toISOString();

        if (await this.isMaintenanceModeOn()) {
            throw new ServiceUnavailableException(MAINTENANCE);
        }

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

        return activeNotifications
    }

    public async getAllNotifications(): Promise<Notifications[]> {
        const notifications = await Notifications.findAll({ order: [['createdAt', 'DESC']] });
        return notifications
    }

    public async toggleMaintenanceMode(
        isMaintenanceMode: boolean
    ): Promise<{ success: boolean; message: string; notification?: Notifications }> {
        if (isMaintenanceMode) {
            // Enable maintenance mode
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMinutes(startDate.getMinutes() + 3, 0);

            const [notification, created] = await Notifications.findOrCreate({
                where: { maintenanceMode: true },
                defaults: {
                    title: "Scheduled Maintenance Alert",
                    notice: "The system will undergo scheduled maintenance shortly. Kindly ensure your work is backed up before the maintenance begins.",
                    maintenanceMode: true,
                    visibleOnWeb: true,
                    visibleOnExtension: true,
                    startDate,
                    endDate,
                },
            });

            if (!created) {
                // Update startDate and endDate if a maintenance mode notification already exists
                notification.startDate = startDate;
                notification.endDate = endDate;
                await notification.save();
            }

            return {
                success: true,
                message: "Maintenance mode enabled successfully.",
                notification,
            };
        } else {
            // Disable maintenance mode
            const deletedCount = await Notifications.destroy({
                where: { maintenanceMode: true },
            });

            if (deletedCount === 0) {
                throw new NotFoundException(
                    notificationsMessages.findNotficiationByIdNotFound
                );
            }

            return {
                success: true,
                message: notificationsMessages.maintenanceModeDisabled,
            };
        }
    }

    public async getMaintainceModeNotification(): Promise<{
        maintenance: {
            maintenanceMode: boolean,
            title: string,
            notice: string,
            startDate: string,
            endDate: string,
        };
        success: boolean;
    }> {
        const notification = await Notifications.findOne({
            where: {
                maintenanceMode: true,
                endDate: {
                    [Op.lt]: new Date().toISOString(),
                },
            }
        });

        if (!notification) {
            return {
                maintenance: {
                    maintenanceMode: false,
                    title: "",
                    notice: "",
                    startDate: "",
                    endDate: "",
                },
                success: true,
            }
        }

        return {
            maintenance: {
                maintenanceMode: notification.maintenanceMode,
                title: notification.title,
                notice: notification.notice,
                startDate: notification.startDate.toISOString(),
                endDate: notification.endDate.toISOString(),
            },
            success: true,
        };
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
        notification.visibleOnWeb = updateNotificationDto.visibleOnWeb
        notification.visibleOnExtension = updateNotificationDto.visibleOnExtension

        await notification.save();
        return notification;
    }

    async deleteNotification(id: string): Promise<void> {
        const notification = await this.findOne(id);
        await notification.destroy();
    }
}
