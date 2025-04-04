import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
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
import { NotificationSettingService } from './notification-setting.service';
import {
  CreateNotificationSettingsDto,
  GetNotificationSettingDto,
  UpdateNotificationSettingDto,
} from './dto';
import { createNotificationSetting } from './body';

@ApiTags('Notification Setttings')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('notification-settings')
export class NotificationSettingController {
  constructor(
    private readonly notificationSettingService: NotificationSettingService,
  ) {}

  @ApiOperation({
    summary: 'Create Notification Settings of a User',
  })
  @ApiBody(createNotificationSetting)
  @Post('/')
  createNotificationSetting(
    @Body() createNotificationSettingsDto: CreateNotificationSettingsDto[],
    @AuthUser() user: User,
  ) {
    return this.notificationSettingService.createNotificationSetting(
      createNotificationSettingsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Notification Setting of a user',
  })
  @Get('/')
  getUserNotificationSetting(
    @AuthUser() user: User,
    @Query() getNotificationSettingDto: GetNotificationSettingDto,
  ) {
    return this.notificationSettingService.getUserNotificationSetting(
      getNotificationSettingDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Updtae Notification Settings of a User',
  })
  @Put('/')
  updateNotificationSetting(
    @Body() updateNotificationSettingDto: UpdateNotificationSettingDto,
    @AuthUser() user: User,
  ) {
    return this.notificationSettingService.updateNotificationSetting(
      updateNotificationSettingDto,
      user,
    );
  }
}
