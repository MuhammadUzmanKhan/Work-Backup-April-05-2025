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
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
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
import { MobileIncidentInboxService } from './mobile-incident-inbox.service';
import {
  CreateMobileIncidentInboxDto,
  UpdateMobileIncidentInboxDto,
} from './dto';

@ApiTags('Mobile Incident Inboxes')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('mobile-incident-inboxes')
export class MobileIncidentInboxController {
  constructor(
    private readonly mobileIncidentInboxService: MobileIncidentInboxService,
  ) {}

  @ApiOperation({
    summary: 'Create a Mobile Incident Inbox',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_CREATE)
  @Post()
  createMobileIncidentInbox(
    @Body() createMobileIncidentInboxDto: CreateMobileIncidentInboxDto,
  ) {
    return this.mobileIncidentInboxService.createMobileIncidentInbox(
      createMobileIncidentInboxDto,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Mobile Incident Inboxes',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_VIEW_ALL)
  @Get()
  getAllMobileIncidentInboxes(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.mobileIncidentInboxService.getAllMobileIncidentInboxes(
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Get a Mobile Incident Inbox by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_VIEW)
  @Get('/:id')
  getMobileIncidentInboxById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.mobileIncidentInboxService.getMobileIncidentInboxById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Mobile Incident Inbox',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_UPDATE)
  @Put('/:id')
  updateMobileIncidentInbox(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateMobileIncidentInboxDto: UpdateMobileIncidentInboxDto,
  ) {
    return this.mobileIncidentInboxService.updateMobileIncidentInbox(
      pathParamIdDto.id,
      updateMobileIncidentInboxDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Mobile Incident Inbox',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MOBILE_INCIDENT_INBOX_DELETE)
  @Delete('/:id')
  deleteMobileIncidentInbox(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.mobileIncidentInboxService.deleteMobileIncidentInbox(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }
}
