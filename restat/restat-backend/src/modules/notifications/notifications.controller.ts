import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Public } from 'src/common/decorators/public.meta';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('notifications')
export class NotificationsController {

    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    @Post()
    public async create(@Body() createNotificationDto: CreateNotificationDto) {
        return await this.notificationsService.createNotification(createNotificationDto);
    }

    @Public()
    @Get('active')
    public async getActiveNotifications() {
        return await this.notificationsService.getActiveNotifications();
    }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    @Post('toggle-maintenance')
    async enableMaintenanceMode(
        @Body("isMaintenanceMode") isMaintenanceMode: boolean
    ) {
        return await this.notificationsService.toggleMaintenanceMode(isMaintenanceMode);
    }

    @Public()
    @Get()
    public async getAllNotifications() {
        return await this.notificationsService.getAllNotifications();
    }

    @Public()
    @Get('maintenance')
    public async getMaintenanceMode() {
        return await this.notificationsService.getMaintainceModeNotification();
    }

    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    @Put()
    public async update(
        @Query('id') id: string,
        @Body() updateNotificationDto: UpdateNotificationDto,
    ) {
        return await this.notificationsService.updateNotification(id, updateNotificationDto);
    }

    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    @Delete()
    public async remove(
        @Query('id') id: string
    ) {
        await this.notificationsService.deleteNotification(id);
        return { message: `Notification with ID ${id} deleted successfully` };
    }
}
