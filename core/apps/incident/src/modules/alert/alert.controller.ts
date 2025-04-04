import { Observable, of } from 'rxjs';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { AlertService } from './alert.service';
import {
  AvailableKeyContactDto,
  AvailableStaffUserDto,
  CloneAlertsDto,
  CreateAlertDto,
  CreateBulkAlertDto,
  CreateMultipleAlertDto,
  DeleteStaffAlert,
  GetAllAlerts,
  ManageIncidentTypeAlertDto,
  RemoveAllAlerts,
  UpdateAlertDto,
} from './dto';
import { cloneAlertBody } from './body';

@ApiTags('Alerts')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @ApiOperation({
    summary: 'Create a Alert',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CREATE)
  @Post()
  createAlert(@Body() createAlertDto: CreateAlertDto, @AuthUser() user: User) {
    return this.alertService.createAlert(createAlertDto, user);
  }

  @ApiOperation({
    summary: 'Create Multiple Alerts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CREATE_MULTIPLE)
  @Post('/create-multiple-alert')
  createMultipleAlert(
    @Body() createMultipleAlertDto: CreateMultipleAlertDto,
    @AuthUser() user: User,
  ) {
    return this.alertService.createMultipleAlert(createMultipleAlertDto, user);
  }

  @ApiOperation({
    summary: 'Manage Incident Type Alerts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CREATE_MULTIPLE)
  @Post('/incident-type')
  manageIncidentTypeAlerts(
    @Body() manageIncidentTypeAlertDto: ManageIncidentTypeAlertDto,
    @AuthUser() user: User,
  ) {
    return this.alertService.manageIncidentTypeAlerts(
      manageIncidentTypeAlertDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Create Alerts for assigning bulk email and sms to user',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CREATE_MULTIPLE)
  @Post('/bulk')
  createBulkAlert(
    @Body() createBulkAlertDto: CreateBulkAlertDto,
    @AuthUser() user: User,
  ) {
    return this.alertService.createBulkAlert(createBulkAlertDto, user);
  }

  @ApiOperation({
    summary: 'Clone Alerts',
  })
  @ApiBody(cloneAlertBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CLONE)
  @Post('/clone')
  @ApiBody(cloneAlertBody)
  cloneAlerts(@AuthUser() user: User, @Body() clone_alert: CloneAlertsDto) {
    return this.alertService.cloneAlerts(user, clone_alert);
  }

  @ApiOperation({
    summary: 'Fetch all Available Key Contacts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_KEY_CONTACTS)
  @Get('/available-key-contact')
  getAvailableKeyContact(
    @Query() availableKeyContactDto: AvailableKeyContactDto,
    @AuthUser() user: User,
  ) {
    return this.alertService.getAvailableKeyContact(
      availableKeyContactDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Available Staff Users',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_STAFF_USER)
  @Get('/available-staff-user')
  getAvailableStaffUser(
    @Query() availableStaffUserDto: AvailableStaffUserDto,
    @AuthUser() user: User,
  ) {
    return this.alertService.getAvailableStaffUser(availableStaffUserDto, user);
  }

  @ApiOperation({
    summary: 'Fetch all Available Key Contacts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_STAFF_USER)
  @Get('/all-key-contact-count')
  getAllIncidentTypeAndPriorityGuideCount(
    @Query() eventQueryDto: EventIdQueryDto,
  ) {
    return this.alertService.getAllIncidentTypeAndPriorityGuideCount(
      eventQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Alert Counts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_STAFF_USER)
  @Get('/count')
  getAlertCount(@Query() eventQueryDto: EventIdQueryDto) {
    return this.alertService.getAlertCount(eventQueryDto.event_id);
  }

  @ApiOperation({
    summary: 'Fetch all Alert Counts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_STAFF_USER)
  @Get('/all')
  getAllAlerts(@Query() getAllAlerts: GetAllAlerts, @AuthUser() user: User) {
    return this.alertService.getAllAlerts(getAllAlerts, user);
  }

  @ApiOperation({
    summary: 'Fetch all Alert Counts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_VIEW_ALL_AVAILABLE_STAFF_USER)
  @Get('/all-names')
  getAllAlertsStaffNames(
    @Query() getAllAlerts: GetAllAlerts,
    @AuthUser() user: User,
  ) {
    return this.alertService.getAllAlertsStaffNames(getAllAlerts, user);
  }

  @ApiOperation({
    summary: 'Update Alert',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_UPDATE)
  @Put('/:id')
  updateAlert(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    return this.alertService.updateAlert(pathParamIdDto.id, updateAlertDto);
  }

  @ApiOperation({
    summary: 'Destroy All Alerts Against Priority Guide',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_DELETE)
  @Delete('/remove/all')
  removeAllAlerts(@Query() removeAllAlerts: RemoveAllAlerts) {
    return this.alertService.removeAllAlerts(removeAllAlerts);
  }

  @ApiOperation({
    summary: 'Destroy Alert',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_DELETE)
  @Delete('/:id')
  deleteAlert(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdDto: EventIdQueryDto,
  ) {
    return this.alertService.deleteAlert(
      pathParamIdDto.id,
      eventIdDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Destroy Alert of Event Contact or Department User',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_DELETE)
  @Delete('staff/:id')
  deleteStaffAlert(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() deleteStaffAlert: DeleteStaffAlert,
  ) {
    return this.alertService.deleteStaffAlert(
      pathParamIdDto.id,
      deleteStaffAlert,
    );
  }

  @MessagePattern('get-incident-alert-counts')
  async getIncidentAlertCounts(data: any): Promise<Observable<any>> {
    // This try catch should not be deleted.
    try {
      const eventId: number = parseInt(decryptData(data.body));

      const alertCounts =
        await this.alertService.getAllIncidentTypeAndPriorityGuideCount(
          eventId,
          { useMaster: true },
        );

      return of(alertCounts);
    } catch (error) {
      return of(error.response);
    }
  }
}
