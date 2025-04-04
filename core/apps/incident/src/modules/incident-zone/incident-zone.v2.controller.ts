import { Request, Response } from 'express';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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

import { IncidentMainZoneQueryParamsDto } from './dto';
import { IncidentZoneV2Service } from './incident-zone.v2.service';

@ApiTags('Incident Zones')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller({ path: 'incident-zones', version: '2' })
export class IncidentZoneV2Controller {
  constructor(private readonly incidentZoneV2Service: IncidentZoneV2Service) {}

  @ApiOperation({
    summary: 'Fetch all Incident Zones',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_ZONE_VIEW_ALL,
    UserAccess.INCIDENT_ZONE_DOWNLOAD_PDF,
  )
  @Get()
  getAllIncidentZones(
    @Query() incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneV2Service.getAllIncidentZones(
      incidentZoneQueryParamsDto,
      res,
      req,
      user,
    );
  }
}
