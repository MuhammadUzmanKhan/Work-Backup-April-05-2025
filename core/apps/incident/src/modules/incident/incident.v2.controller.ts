import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  COMPANY_ID_API_HEADER,
  PaginationInterface,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { FormattedIncidentData } from '@Common/constants/interfaces';

import { GetIncidentLegalCountDto, IncidentQueryParamsDto } from './dto';
import { IncidentV2Service } from './incident.v2.service';
import { GetIncidentCount, GetIncidentLegalCount } from './helpers/interfaces';

@ApiTags('Incidents')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller({ path: 'incidents', version: '2' })
export class IncidentV2Controller {
  constructor(private readonly incidentV2Service: IncidentV2Service) {}

  @ApiOperation({
    summary: 'Fetch all Incidents',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get()
  getAllIncidents(
    @Query() incidentQueryParamsDto: IncidentQueryParamsDto,
    @AuthUser() user: User,
  ): Promise<{
    data: FormattedIncidentData[];
    pagination: PaginationInterface;
  }> {
    return this.incidentV2Service.getAllIncidents(incidentQueryParamsDto, user);
  }

  @ApiOperation({
    summary:
      'Retrieve legal incident counts (Concluded, Archived, Open) for a company',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/legal-count')
  getIncidentLegalCount(
    @Query() getIncidentLegalCountDto: GetIncidentLegalCountDto,
    @AuthUser() user: User,
  ): Promise<GetIncidentLegalCount> {
    return this.incidentV2Service.getIncidentLegalCount(
      getIncidentLegalCountDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Incident Counts based on statuses and priorities',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/counts')
  getIncidentCounts(
    @Query() incidentQueryParamsDto: IncidentQueryParamsDto,
    @AuthUser() user: User,
  ): Promise<GetIncidentCount> {
    return this.incidentV2Service.getIncidentCounts(
      incidentQueryParamsDto,
      user,
    );
  }
}
