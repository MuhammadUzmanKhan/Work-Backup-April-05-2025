import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
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
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { IncidentMessageCenterService } from './incident-message-center.service';
import { CloneDto } from '@Common/dto';
import {
  CreateIncidentMessageCenterDto,
  UpdateIncidentMessageCenterDto,
  GetIncidentMessageCenterDto,
  SnoozeIncidentMessageCenterDto,
} from './dto';
import { cloneIncidentMessageInbox } from './body';

@ApiTags('Incident Message Centers')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incident-message-centers')
export class IncidentMessageCenterController {
  constructor(
    private readonly incidentMessageCenterService: IncidentMessageCenterService,
  ) {}

  @ApiOperation({
    summary: 'Create a Incident Message Center',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_CREATE)
  @Post()
  createIncidentMessageCenter(
    @Body() createIncidentMessageCenterDto: CreateIncidentMessageCenterDto,
  ) {
    return this.incidentMessageCenterService.createIncidentMessageCenter(
      createIncidentMessageCenterDto,
    );
  }

  @ApiOperation({
    summary: 'Clone Incident Message Inboxes',
  })
  @Post('/clone')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_CLONE)
  @ApiBody(cloneIncidentMessageInbox)
  cloneIncidentMessagesInboxes(
    @AuthUser() user: User,
    @Body() cloneIncidentMessageInboxes: CloneDto,
  ) {
    return this.incidentMessageCenterService.cloneIncidentMessagesInboxes(
      user,
      cloneIncidentMessageInboxes,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Message Centers',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_VIEW_ALL)
  @Get()
  getAllIncidentMessageCenters(
    @Query() getIncidentMessageCenterDto: GetIncidentMessageCenterDto,
  ) {
    return this.incidentMessageCenterService.getAllIncidentMessageCenters(
      getIncidentMessageCenterDto,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Message Center Unread Message Count',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_VIEW_ALL)
  @Get('unread-counts')
  getAllUnreadCount(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.incidentMessageCenterService.getAllUnreadCount(
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Get a Incident Message Center by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_VIEW_ALL)
  @Get('/:id')
  getIncidentMessageCenterById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.incidentMessageCenterService.getIncidentMessageCenterById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Add Snooze to a Mobile Incident Message Center',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_SNOOZE)
  @Put('/:id/snooze')
  snoozeIncidentMessageCenter(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() snoozeIncidentMessageCenterDto: SnoozeIncidentMessageCenterDto,
  ) {
    return this.incidentMessageCenterService.snoozeIncidentMessageCenter(
      pathParamIdDto.id,
      snoozeIncidentMessageCenterDto,
    );
  }

  @ApiOperation({
    summary: 'Update a Incident Message Center',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_UPDATE)
  @Put('/:id')
  updateIncidentMessageCenter(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentMessageCenterDto: UpdateIncidentMessageCenterDto,
  ) {
    return this.incidentMessageCenterService.updateIncidentMessageCenter(
      pathParamIdDto.id,
      updateIncidentMessageCenterDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Incident Message Center',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_MESSAGE_CENTER_DELETE)
  @Delete('/:id')
  deleteIncidentMessageCenter(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.incidentMessageCenterService.deleteIncidentMessageCenter(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }
}
