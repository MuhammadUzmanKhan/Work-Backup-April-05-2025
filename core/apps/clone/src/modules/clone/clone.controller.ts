import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { UserAccess } from '@ontrack-tech-group/common/constants';
import { CloneAlertsDto, CloneDto } from '@Modules/clone/dto';
import { cloneAlertBody, cloneBody } from '@Modules/clone/body';
import { CloneService } from '@Modules/clone/clone.service';

@Controller('clone')
@ApiBearerAuth()
@ApiTags('Generic')
export class CloneController {
  constructor(private readonly cloneService: CloneService) {}

  /**
   * This method clone a single feature of alert.
   * It responds to the endpoint "/api/clone/alerts".
   */
  @ApiOperation({
    summary: 'Clone Alerts',
  })
  @ApiBody(cloneAlertBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ALERT_CLONE)
  @Post('/alerts')
  async cloneAlert(
    @AuthUser() user: User,
    @Body() clone_alert: CloneAlertsDto,
  ) {
    return await this.cloneService.cloneAlert(user, clone_alert);
  }

  @ApiOperation({
    summary: 'Clone Event Sources',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_CLONE)
  @Post('/sources')
  cloneIncidentSources(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneIncidentSources(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Types',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_CLONE)
  @Post('/incident-types')
  cloneIncidentTypes(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneIncidentTypes(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Zones',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CLONE)
  @Post('/zones')
  cloneIncidentZones(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneIncidentZones(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Zones and Sub Zones',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CLONE)
  @Post('/sub-zones')
  cloneIncidentSubZones(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneIncidentSubZones(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Cameras Zone',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CLONE)
  @Post('/camera-zones')
  cloneCameraZone(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneCameraZone(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Reference Guides',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_CLONE)
  @Post('/reference-guide')
  cloneReferenceMap(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneReferenceMap(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Workforce Departments',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_CLONE)
  @Post('/event-departments')
  cloneWorkforceDepartments(
    @Body() cloneDto: CloneDto,
    @AuthUser() user: User,
  ) {
    return this.cloneService.cloneWorkforceDepartments(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Workforce Divisions',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_CLONE)
  @Post('/user-incident-divisions')
  cloneWorkforceDivisions(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneWorkforceDivisions(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Messaging Center',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_CLONE)
  @Post('/incident-messages')
  cloneIncidentMessagingCenter(
    @Body() cloneDto: CloneDto,
    @AuthUser() user: User,
  ) {
    return this.cloneService.cloneIncidentMessagingCenter(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Preset Messaging',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_CLONE)
  @Post('/preset-messaging')
  clonePresetMessaging(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.clonePresetMessaging(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Mobile Incident Inboxes',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_CLONE)
  @Post('/mobile-incident-inboxes')
  cloneMobileIncidentInboxes(
    @Body() cloneDto: CloneDto,
    @AuthUser() user: User,
  ) {
    return this.cloneService.cloneMobileIncidentInboxes(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Clone Incident Module Setup',
  })
  @ApiBody(cloneBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_CLONE)
  @Post('/incident-module-setup')
  cloneIncidentModuleSetup(@Body() cloneDto: CloneDto, @AuthUser() user: User) {
    return this.cloneService.cloneIncidentModuleSetup(user, cloneDto);
  }
}
