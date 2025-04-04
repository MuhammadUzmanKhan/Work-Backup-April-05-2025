import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { AuthUser } from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { CompanyIdDto, PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { NotificationService } from './notification.service';
import { CreateNotification } from './body';
import { CreateNotificationsDto, GetNotificationDto } from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Create Notification',
  })
  @ApiBody(CreateNotification)
  @Post('/')
  createNotification(
    @Body() createNotificationsDto: CreateNotificationsDto,
    @AuthUser() user: User,
  ) {
    return this.notificationService.createNotification(
      user,
      createNotificationsDto,
    );
  }

  @ApiOperation({
    summary: 'Get Notifications of a user',
  })
  @Get('/')
  getAllNotifications(
    @Query() getNotificationDto: GetNotificationDto,
    @AuthUser() user: User,
  ) {
    return this.notificationService.getAllNotifications(
      getNotificationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Notifications counts of a user for Current Date',
  })
  @Get('/counts')
  getAllNotificationsCounts(
    @Query() companyId: CompanyIdDto,
    @AuthUser() user: User,
  ) {
    return this.notificationService.getAllNotificationsCounts(
      companyId.company_id,
      user,
    );
  }

  @ApiOperation({ summary: 'Update notification of a user' })
  @Put('/:id')
  updateNotification(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.notificationService.updateNotification(pathParamIdDto.id, user);
  }
}
