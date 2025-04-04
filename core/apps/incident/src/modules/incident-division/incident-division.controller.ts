import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
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
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { CloneDto } from '@Common/dto';
import { IncidentDivisionService } from './incident-division.service';
import {
  UpdateIncidentDivisionDto,
  CreateIncidentDivisionDto,
  IncidentDivisionQueryParamsDto,
  DivisionAssocitateOrDisassociateToEventDto,
  GetIncidentDivisionDto,
  GetDivisionNamesByEventDto,
} from './dto';

@ApiTags('Incident Divisions')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incident-divisions')
export class IncidentDivisionController {
  constructor(
    private readonly incidentDivisionService: IncidentDivisionService,
  ) {}

  @ApiOperation({
    summary: 'Create a Incident Division',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_CREATE)
  @Post()
  createIncidentDivision(
    @Body() createIncidentDivisionDto: CreateIncidentDivisionDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.createIncidentDivision(
      createIncidentDivisionDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Manage Incident Divisions to Event',
    deprecated: true,
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_DIVISION_ASSOCIATE_TO_EVENT,
    UserAccess.INCIDENT_DIVISION_DISASSOCIATE_FROM_EVENT,
  )
  @Post('/manage-incident-division')
  manageIncidentDivision(
    @Body()
    divisionAssocitateOrDisassociateToEventDto: DivisionAssocitateOrDisassociateToEventDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.manageIncidentDivisions(
      divisionAssocitateOrDisassociateToEventDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Unlink Incident Divisions to Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_DISASSOCIATE_FROM_EVENT)
  @Post('/unlink-incident-division')
  unlinkWorkforceIncidentDivision(
    @Body()
    divisionAssocitateOrDisassociateToEventDto: DivisionAssocitateOrDisassociateToEventDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.unlinkWorkforceIncidentDivision(
      divisionAssocitateOrDisassociateToEventDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Link Incident Divisions to Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_ASSOCIATE_TO_EVENT)
  @Post('/link-incident-division')
  linkWorkforceIncidentDivision(
    @Body()
    divisionAssocitateOrDisassociateToEventDto: DivisionAssocitateOrDisassociateToEventDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.linkWorkforceIncidentDivision(
      divisionAssocitateOrDisassociateToEventDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Clone Incident Division',
  })
  @Post('/clone')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_CLONE)
  cloneIncidentDivision(
    @AuthUser() user: User,
    @Body() cloneIncidentTypes: CloneDto,
  ) {
    return this.incidentDivisionService.cloneIncidentDivision(
      user,
      cloneIncidentTypes,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Divisions',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_DIVISION_VIEW_ALL,
    UserAccess.INCIDENT_DIVISION_DOWNLOAD_CSV,
    UserAccess.INCIDENT_DIVISION_DOWNLOAD_PDF,
  )
  @Get()
  getAllIncidentDivisions(
    @Query() incidentDivisionQueryParamsDto: IncidentDivisionQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.incidentDivisionService.getAllIncidentDivisions(
      incidentDivisionQueryParamsDto,
      user,
      res,
      req,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Divisions for Card View',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Get('/card-view')
  findAllIncidentDivisionsCardView(
    @Query() params: GetIncidentDivisionDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.incidentDivisionService.findAllIncidentDivisionsCardView(
      params,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch All Incident Divisions Names',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Get('/division-names')
  findAllDivisionNamesByEvent(
    @Query() eventIdQueryDto: GetDivisionNamesByEventDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.findAllDivisionNamesByEvent(
      eventIdQueryDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get a Incident Division And Department Count',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_DIVISION_VIEW_ALL,
    UserAccess.DEPARTMENT_VIEW_ALL,
  )
  @Get('/workforce-count')
  getIncidentWorkforceCount(
    @Query()
    eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.getIncidentWorkforceCount(
      user,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Get a Incident Division by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW)
  @Get('/:id')
  getIncidentDivisionById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query()
    eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.getIncidentDivisionById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Incident Division',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_UPDATE)
  @Put('/:id')
  updateIncidentDivision(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentDivisionDto: UpdateIncidentDivisionDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.updateIncidentDivision(
      pathParamIdDto.id,
      updateIncidentDivisionDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Incident Division',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_DELETE)
  @Delete('/:id')
  deleteIncidentDivision(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.incidentDivisionService.deleteIncidentDivision(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }
}
