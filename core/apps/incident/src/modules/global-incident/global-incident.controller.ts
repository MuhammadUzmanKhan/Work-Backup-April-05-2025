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
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { GlobalIncidentService } from './global-incident.service';
import {
  CreateGlobalIncidentDto,
  GetGlobalIncidentDto,
  UpdateGlobalIncidentDto,
} from './dto';
import { createGlobalIncident } from './body';

@ApiTags('Global Incident')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('global-incidents')
export class GlobalIncidentController {
  constructor(private readonly globalIncidentService: GlobalIncidentService) {}

  @ApiOperation({
    summary: 'Create a Global Incident',
  })
  @ApiBody(createGlobalIncident)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.GLOBAL_INCIDENT_CREATE)
  @Post()
  createIncident(@Body() createIncidentDto: CreateGlobalIncidentDto) {
    return this.globalIncidentService.createGlobalIncident(createIncidentDto);
  }

  @ApiOperation({
    summary: 'Get all Global Incidents',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.GLOBAL_INCIDENT_VIEW_ALL)
  @Get('/')
  getGlobalIncidents(
    @Query() getGlobalIncidentDto: GetGlobalIncidentDto,
    @AuthUser() user: User,
  ) {
    return this.globalIncidentService.getGlobalIncidents(
      getGlobalIncidentDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Global Incident By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.GLOBAL_INCIDENT_VIEW_ALL)
  @Get('/:id')
  getGlobalIncidentById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventQueryDto: EventIdQueryDto,
  ) {
    return this.globalIncidentService.getGlobalIncidentById(
      pathParamIdDto.id,
      eventQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Global Incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.GLOBAL_INCIDENT_UPDATE)
  @Put('/:id')
  updateGlobalIncident(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateGlobalIncidentDto: UpdateGlobalIncidentDto,
  ) {
    return this.globalIncidentService.updateGlobalIncident(
      pathParamIdDto.id,
      updateGlobalIncidentDto,
    );
  }
}
