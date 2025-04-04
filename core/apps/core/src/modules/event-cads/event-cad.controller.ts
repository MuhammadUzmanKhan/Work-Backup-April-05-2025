import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { EventCadService } from './event-cad.service';
import {
  CreateEventCadDto,
  UpdateEventCadDto,
  UpdateEventCadVersionDto,
} from './dto';

@ApiTags('Event Cad')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('event-cad')
export class EventCadController {
  constructor(private readonly eventCadService: EventCadService) {}

  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CAD_CREATE)
  createEventCad(
    @AuthUser() user: User,
    @Body() createEventCadDto: CreateEventCadDto,
  ) {
    return this.eventCadService.createEventCad(user, createEventCadDto);
  }

  @Get('')
  @ApiOperation({
    summary: 'Get All Cads',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CAD_VIEW)
  getAllCads(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.eventCadService.getAllCads(eventIdQueryDto.event_id);
  }

  @Get('/all')
  @ApiOperation({
    summary: 'Get All Event Cads Against Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventCads(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.eventCadService.getAllEventCads(eventIdQueryDto.event_id);
  }

  @Put('/:id/active-version')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CAD_CURRENT_VERSION_UPDATE)
  updateEventCadVersion(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
    @Body() updateEventCadVersionDto: UpdateEventCadVersionDto,
  ) {
    return this.eventCadService.updateEventCadVersion(
      pathParamIdDto.id,
      user,
      updateEventCadVersionDto,
    );
  }

  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CAD_UPDATE)
  updateEventCadData(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
    @Body() updateEventCadDto: UpdateEventCadDto,
  ) {
    return this.eventCadService.updateEventCadData(
      pathParamIdDto.id,
      user,
      updateEventCadDto,
    );
  }
}
