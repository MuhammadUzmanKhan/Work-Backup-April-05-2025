import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  Req,
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
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  EventIdQueryOptionalDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { CloneDto } from '@Common/dto';
import { IncidentTypeService } from './incident-type.service';
import {
  TypeAssocitateOrDisassociateToEventDto,
  CreateIncidentTypeDto,
  IncidentTypeQueryParamsDto,
  UpdateIncidentTypeDto,
  GetIncidentTypeNamesDto,
  UploadIncidentTypesDto,
  DestroyMultipleIncidentTypesDto,
  GetAlertIncidentTypesDto,
  GetIncidentTypeUsersDto,
  GetIncidentTypeIncidentsDto,
  RequestIncidentTypeDto,
} from './dto';
import {
  destroyMultipleIncidentTypes,
  manageIncidentTypes,
  uploadIncidentTypes,
} from './body';

@ApiTags('Incident Types')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incident-types')
export class IncidentTypeController {
  constructor(private readonly incidentTypeService: IncidentTypeService) {}

  @ApiOperation({
    summary: 'Create a Incident Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_CREATE)
  @Post()
  createIncidentType(
    @Body() createIncidentTypeDto: CreateIncidentTypeDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.createIncidentType(
      createIncidentTypeDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Request a Incident Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_REQUEST)
  @Post('/request')
  requestIncidentType(
    @Body() requestIncidentTypeDto: RequestIncidentTypeDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.requestIncidentType(
      requestIncidentTypeDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Associate or Disassociate Incident Types to Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGE)
  @ApiBody(manageIncidentTypes)
  @Post('/manage-incident-types')
  manageIncidentTypes(
    @Body()
    typeAssocitateOrDisassociateToEventDto: TypeAssocitateOrDisassociateToEventDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.manageIncidentTypes(
      typeAssocitateOrDisassociateToEventDto,
      user,
    );
  }

  @ApiOperation({ summary: 'Upload the Types against event through CSV.' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_CREATE)
  @ApiBody(uploadIncidentTypes)
  @Post('/upload')
  async uploadIncidentTypes(
    @Body() uploadIncidentTypesDto: UploadIncidentTypesDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.uploadIncidentTypes(
      uploadIncidentTypesDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Clone Event Incident Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_CLONE)
  @Post('/clone')
  cloneEventTypes(@Body() clone_incident_types: CloneDto) {
    return this.incidentTypeService.cloneEventIncidentTypes(
      clone_incident_types,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_VIEW_ALL)
  @Get()
  getAllIncidentTypes(
    @Query() incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.incidentTypeService.getAllIncidentTypes(
      incidentTypeQueryParamsDto,
      user,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Types without categorization',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_TYPE_VIEW_ALL,
    UserAccess.INCIDENT_TYPE_DOWNLOAD_CSV,
    UserAccess.INCIDENT_TYPE_DOWNLOAD_PDF,
  )
  @Get('/list')
  getAllIncidentTypesUncategorized(
    @Query() incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.incidentTypeService.getAllIncidentTypesUncategorized(
      incidentTypeQueryParamsDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Type Names',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_VIEW_ALL)
  @Get('/names')
  getAllIncidentTypeNames(
    @Query() getIncidentTypeNamesDto: GetIncidentTypeNamesDto,
  ) {
    return this.incidentTypeService.getAllIncidentTypeNames(
      getIncidentTypeNamesDto,
    );
  }

  @ApiOperation({
    summary: 'Get Incident Type for Alerts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_VIEW_ALL)
  @Get('/alert-incident-types')
  getAlertIncidentTypes(
    @Query() alertIncidentDto: GetAlertIncidentTypesDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.incidentTypeService.getAlertIncidentTypes(
      alertIncidentDto,
      user,
      res,
    );
  }

  @ApiOperation({
    summary: 'Get all users who are linked with Incident Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_VIEW_ALL)
  @Get('/users')
  getUsersByIncidentType(
    @Query() getIncidentTypeUsersDto: GetIncidentTypeUsersDto,
  ) {
    return this.incidentTypeService.getUsersByIncidentType(
      getIncidentTypeUsersDto,
    );
  }

  @ApiOperation({
    summary:
      'Retrieve all incidents with the specified Incident Type ID. If no Incident Type ID is provided, return all critical incidents.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_TYPE_VIEW_ALL,
    UserAccess.INCIDENT_VIEW_ALL,
  )
  @Get('/incidents')
  getIncidentsByIncidentType(
    @Query() getIncidentTypeIncidentsDto: GetIncidentTypeIncidentsDto,
  ) {
    return this.incidentTypeService.getIncidentsByIncidentType(
      getIncidentTypeIncidentsDto,
    );
  }

  @ApiOperation({
    summary: 'Get Incident Type by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_VIEW)
  @Get('/:id')
  getIncidentTypeById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.getIncidentTypeById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Pin an Incident Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_PIN)
  @Put('/:id/pin')
  pinIncidentType(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() eventIdQueryDto: EventIdQueryOptionalDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.pinIncidentType(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Incident Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_UPDATE)
  @Put('/:id')
  updateIncidentType(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentTypeDto: UpdateIncidentTypeDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.updateIncidentType(
      pathParamIdDto.id,
      updateIncidentTypeDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Destroy Multiple Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_DELETE)
  @ApiBody(destroyMultipleIncidentTypes)
  @Delete()
  deleteIncidentType(
    @Body() destroyMultipleIncidentTypesDto: DestroyMultipleIncidentTypesDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeService.deleteIncidentType(
      destroyMultipleIncidentTypesDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Remove all Alerts of Incident Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_REMOVE_ALERTS)
  @Delete('/:id/remove-alerts')
  removeAlerts(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdDto: EventIdQueryDto,
  ) {
    return this.incidentTypeService.removeAlerts(
      pathParamIdDto.id,
      eventIdDto.event_id,
    );
  }
}
