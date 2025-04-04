import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { Observable, of } from 'rxjs';
import {
  ChangeLog,
  Comment,
  Event,
  Image,
  Incident,
  User,
} from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  IncidentDashboardStats,
  PaginationInterface,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  EventIdQueryDto,
  PaginationDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { CloneDto } from '@Common/dto';

import { IncidentService } from './incident.service';
import {
  IncidentQueryParamsDto,
  CreateIncidentDto,
  UpdateIncidentDto,
  EventIncidentReportDto,
  IncidentDashboardReportOverviewDto,
  EventNamesQueryParams,
  IncidentChangelogQueryParamsDto,
  CreateCommentDto,
  CreateImageDto,
  DispatchIncidentDto,
  LinkIncidentDto,
  RemoveIncidentDepartmentDto,
  GetDispatchLogsDto,
  UploadIncidentDto,
  RemoveImageDto,
  IncidentOverviewStatsQueryParamsDto,
  DashboardPdfDto,
  UnLinkIncidentDto,
  IncidentQueryParamsForMapDto,
  GetIncidentCountMobileDto,
  UpdateIncidentLegalStatusDto,
  MarkCommentRead,
} from './dto';
import { FormattedIncidentData } from '@Common/constants/interfaces';
import {
  createCommentBody,
  createImageBody,
  createIncident,
  dispatchIncidentBody,
  eventIncidentDashboardReport,
  eventIncidentDashboardReportNew,
  eventIncidentReport,
  linkIncidentBody,
  unlinkIncidentDispatch,
  updateIncident,
  updateIncidentLegalStatus,
  uploadIncident,
} from './body';
import { GetIncidentCount } from './helpers/interfaces';

@ApiTags('Incidents')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @ApiOperation({
    summary: 'Create an Incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_CREATE)
  @ApiBody(createIncident)
  @Post()
  createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ): Promise<Incident> {
    return this.incidentService.createIncident(createIncidentDto, user, req);
  }

  @ApiOperation({
    summary: 'Create an Incident for new version',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_CREATE)
  @ApiBody(createIncident)
  @Post('v1')
  createIncidentV1(
    @Body() createIncidentDto: CreateIncidentDto,
    @AuthUser() user: User,
  ): Promise<Incident> {
    return this.incidentService.createIncidentV1(createIncidentDto, user);
  }

  @ApiOperation({
    summary: 'Create Event Incident Report PDF',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DETAIL_PDF)
  @ApiBody(eventIncidentReport)
  @Post('/pdf')
  getEventIncidentReport(
    @Body() eventIncidentReportDto: EventIncidentReportDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    return this.incidentService.getEventIncidentReport(
      eventIncidentReportDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Create Event Incident Dashboard Full Overview Report PDF',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DASHBOARD_PDF)
  @ApiBody(eventIncidentDashboardReport)
  @Post('/dashboard-report')
  getEventIncidentDashboardOverview(
    @Body()
    incidentDashboardReportOverviewDto: IncidentDashboardReportOverviewDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    return this.incidentService.getEventIncidentDashboardOverview(
      incidentDashboardReportOverviewDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Clone Complete incident setup module of an event',
  })
  @ApiBody(eventIncidentDashboardReport)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_CLONE)
  @Post('/clone-setup-module')
  cloneIncidentSetupModule(
    @Body()
    cloneDto: CloneDto,
    @AuthUser() user: User,
  ): Promise<void> {
    return this.incidentService.cloneIncidentSetupModule(user, cloneDto);
  }

  @ApiOperation({
    summary: 'Add a comment',
  })
  @ApiBody(createCommentBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ADD_COMMENT)
  @Post('/comment')
  createAComment(
    @Body()
    createCommentDto: CreateCommentDto,
    @AuthUser() user: User,
  ): Promise<Comment> {
    return this.incidentService.createComment(user, createCommentDto);
  }

  @ApiOperation({
    summary: 'Upload an Image',
  })
  @ApiBody(createImageBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UPLOAD_IMAGE)
  @Post('/image')
  createImage(
    @Body()
    createImageDto: CreateImageDto,
    @AuthUser() user: User,
  ): Promise<Image> {
    return this.incidentService.createImage(user, createImageDto);
  }

  @ApiOperation({
    summary: 'Dispatch User to Incident',
  })
  @ApiBody(dispatchIncidentBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DISPATCH_STAFF)
  @Post('/dispatch-staff')
  dispatchStaff(
    @Body()
    dispatchIncidentDto: DispatchIncidentDto,
    @AuthUser() user: User,
  ): Promise<{
    message: string;
  }> {
    return this.incidentService.dispatchStaff(user, dispatchIncidentDto);
  }

  @ApiOperation({
    summary: 'Upload Incidents through CSV',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UPLOAD)
  @ApiBody(uploadIncident)
  @Post('/upload')
  uploadIncident(
    @Body() uploadIncidentDto: UploadIncidentDto,
    @AuthUser() user: User,
  ): Promise<
    | {
        message: string;
      }
    | undefined
  > {
    return this.incidentService.uploadIncident(uploadIncidentDto, user);
  }

  @ApiOperation({
    summary: 'Mark Comment as Read for a user',
  })
  @Post('/mark-read')
  markCommentRead(
    @Body()
    markCommentRead: MarkCommentRead,
    @AuthUser() user: User,
  ): Promise<Incident> {
    return this.incidentService.markCommentRead(user, markCommentRead);
  }

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
    data: Incident[];
    pagination: PaginationInterface;
  }> {
    return this.incidentService.getAllIncidents(incidentQueryParamsDto, user);
  }

  @ApiOperation({
    summary: 'Fetch all Incidents',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/map')
  getAllIncidentsForMap(
    @Query() incidentQueryParamsDto: IncidentQueryParamsForMapDto,
    @AuthUser() user: User,
  ): Promise<{
    data: Incident[];
  }> {
    return this.incidentService.getAllIncidentsForMap(
      incidentQueryParamsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Download all Incidents CSV',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DOWNLOAD_CSV)
  @Get('/csv')
  getIncidentsCsv(
    @Query() incidentQueryParamsDto: IncidentQueryParamsDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    return this.incidentService.getIncidentsCsv(
      incidentQueryParamsDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Linked Incidents',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_LINKED_INCIDENTS)
  @Get('/:id/linked-incidents')
  getAllLinkedIncidents(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query()
    eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ): Promise<FormattedIncidentData[]> {
    return this.incidentService.getAllLinkedIncidents(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Incident Counts By Status',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/mobile/counts')
  getIncidentCountsMobile(
    @Query() incidentCountMobileDto: GetIncidentCountMobileDto,
    @AuthUser() user: User,
  ): Promise<{
    total_incident_count: number;
  }> {
    return this.incidentService.getIncidentCountsMobile(
      incidentCountMobileDto,
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
    return this.incidentService.getIncidentCounts(incidentQueryParamsDto, user);
  }

  @ApiOperation({
    summary: 'Get Incident Overview Stats for Incident Dashboard Graph',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_OVERVIEW_STATS)
  @Get('/overview-stats')
  getIncidentOverviewStats(
    @AuthUser()
    user: User,
    @Query()
    incidentOverviewStatsQueryParamsDto: IncidentOverviewStatsQueryParamsDto,
  ): Promise<{
    counts: {
      incidentCounts: number;
    };
    data: IncidentDashboardStats;
  }> {
    return this.incidentService.getIncidentOverviewStats(
      user,
      incidentOverviewStatsQueryParamsDto,
    );
  }

  @ApiOperation({
    summary: 'Get Incident Overview Stats for IOS Incident Dashboard Graph',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_OVERVIEW_STATS)
  @Get('/mobile/overview-stats')
  getIncidentOverviewStatsMobile(
    @AuthUser()
    user: User,
    @Query()
    incidentOverviewStatsQueryParamsDto: IncidentOverviewStatsQueryParamsDto,
    @Headers('authorization') authorization: string,
  ): Promise<Incident | undefined> {
    return this.incidentService.getIncidentOverviewStatsMobile(
      user,
      incidentOverviewStatsQueryParamsDto,
      authorization,
    );
  }

  @ApiOperation({
    summary: 'Get Incident Sources, Types and Zones count',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.SOURCE_VIEW_ALL,
    UserAccess.INCIDENT_TYPE_VIEW_ALL,
    UserAccess.INCIDENT_ZONE_VIEW_ALL,
  )
  @Get('/setup-module-counts')
  getIncidentModuleCounts(@Query() eventIdDto: EventIdQueryDto): Promise<{
    incidentSourceCount: number;
    incidentTypesCount: number;
    incidentZoneCount: number;
    incidentSubZoneCount: number;
  }> {
    return this.incidentService.getIncidentModuleCounts(eventIdDto.event_id);
  }

  @ApiOperation({
    summary: 'Get all Event Names of provied company_id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.SOURCE_CLONE,
    UserAccess.INCIDENT_TYPE_CLONE,
    UserAccess.INCIDENT_ZONE_CLONE,
    UserAccess.ALERT_CLONE,
    UserAccess.PRIORITY_GUIDE_CLONE,
    UserAccess.DEPARTMENT_CLONE,
    UserAccess.INCIDENT_DIVISION_CLONE,
    UserAccess.REFERENCE_MAP_CLONE,
    UserAccess.PRESET_MESSAGE_CLONE,
    UserAccess.INCIDENT_MESSAGE_CENTER_CLONE,
  )
  @Get('/event-names')
  getAllEventNames(
    @Query() eventNameQuery: EventNamesQueryParams,
    @AuthUser() user: User,
  ): Promise<{
    data: Event[];
    pagination: PaginationInterface;
  }> {
    return this.incidentService.getAllEventNames(eventNameQuery, user);
  }

  @ApiOperation({
    summary: 'Get Incident Dashboard Overview PDF',
  })
  @Post('/dashboard-overview')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DASHBOARD_PDF)
  @ApiBody(eventIncidentDashboardReportNew)
  getSelectedUserCsvPdf(
    @Body() dashboardPdfDto: DashboardPdfDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    return this.incidentService.getDashboardPdf(
      dashboardPdfDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch changelog or status log of an Incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_CHANGE_LOGS)
  @Get('/:id/change-logs')
  getIncidentChangelogs(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() incidentChangelogQueryParamsDto: IncidentChangelogQueryParamsDto,
    @AuthUser() user: User,
  ): Promise<{
    data: ChangeLog[];
    pagination: PaginationInterface;
  }> {
    return this.incidentService.getIncidentChangelogs(
      pathParamIdDto.id,
      incidentChangelogQueryParamsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch attachments/images of an Incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_IMAGES)
  @Get('/:id/images')
  getIncidentImages(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ): Promise<Image[]> {
    return this.incidentService.getIncidentImages(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Fetch comments of an Incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_COMMENTS)
  @Get('/:id/comments')
  getIncidentComments(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() paginationDto: PaginationDto,
    @AuthUser() user: User,
  ): Promise<{
    data: Comment[];
    pagination: PaginationInterface;
  }> {
    return this.incidentService.getIncidentComments(
      pathParamIdDto.id,
      paginationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch dispatch log of an incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_DISPATCH_LOGS)
  @Get('/:id/dispatch-logs')
  getIncidentDispatchLogs(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getDispatchLogsDto: GetDispatchLogsDto,
    @AuthUser() user: User,
  ): Promise<Incident | null> {
    return this.incidentService.getIncidentDispatchLogs(
      pathParamIdDto.id,
      getDispatchLogsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Incident By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/:id')
  getIncidentById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ): Promise<Incident> {
    return this.incidentService.getIncidentById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Incident By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_VIEW_ALL)
  @Get('/:id/mobile')
  getIncidentByIdiOS(
    @Headers('authorization') authorization: string,
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ): Promise<Incident | undefined> {
    return this.incidentService.getIncidentByIdiOS(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
      authorization,
    );
  }

  @ApiOperation({
    summary: 'Link an Incident',
  })
  @ApiBody(linkIncidentBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_LINK_INCIDENT)
  @Put('/link-incidents')
  linkIncidents(
    @Body()
    linkIncidentDto: LinkIncidentDto,
    @AuthUser() user: User,
  ): Promise<{
    message: string;
  }> {
    return this.incidentService.linkIncidents(linkIncidentDto, user);
  }

  @ApiOperation({
    summary: 'UnLink an Incident',
  })
  @ApiBody(linkIncidentBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UNLINK_INCIDENT)
  @Put('/unlink-incidents')
  unLinkIncidents(
    @Body()
    unLinkIncidentDto: UnLinkIncidentDto,
    @AuthUser() user: User,
  ): Promise<{
    message: string;
  }> {
    return this.incidentService.unLinkIncidents(unLinkIncidentDto, user);
  }

  @ApiOperation({
    summary: 'Update an Incident',
  })
  @ApiBody(updateIncident)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UPDATE)
  @Put('/:id')
  updateIncident(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ): Promise<UpdateIncidentDto> {
    return this.incidentService.updateIncident(
      pathParamIdDto.id,
      updateIncidentDto,
      user,
      req,
    );
  }

  @ApiOperation({
    summary: 'Update an Incident on new version',
  })
  @ApiBody(updateIncident)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_UPDATE,
    UserAccess.INCIDENT_UPDATE_STATUS,
    UserAccess.INCIDENT_UPDATE_PRIORITY,
    UserAccess.INCIDENT_UPDATE_INCIDENT_DIVISION,
    UserAccess.INCIDENT_UPDATE_INCIDENT_TYPE,
    UserAccess.INCIDENT_UPDATE_INCIDENT_ZONE,
    UserAccess.INCIDENT_UPDATE_SOURCE,
    UserAccess.INCIDENT_UPDATE_LOCATION,
    UserAccess.INCIDENT_UPDATE_DESCRIPTION,
    UserAccess.INCIDENT_UPDATE_REPORTER,
    UserAccess.RESOLVED_INCIDENT_NOTE_UPDATE,
    UserAccess.INCIDENT_UPDATE_LEGAL_STATUS,
  )
  @Put('/:id/v1')
  updateIncidentV1(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @AuthUser() user: User,
  ): Promise<Incident> {
    return this.incidentService.updateIncidentV1(
      pathParamIdDto.id,
      updateIncidentDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update the status of Incident to Legal Review',
  })
  @ApiBody(updateIncidentLegalStatus)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UPDATE_LEGAL_STATUS)
  @Put('/:id/legal-status')
  updateIncidentLegalStatus(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentLegalStatusDto: UpdateIncidentLegalStatusDto,
    @AuthUser() user: User,
  ): Promise<Incident> {
    return this.incidentService.updateIncidentLegalStatus(
      pathParamIdDto.id,
      updateIncidentLegalStatusDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Unlink a Dispatched Staff from Incident',
  })
  @ApiBody(unlinkIncidentDispatch)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_UNLINK_DISPATCHED_USER)
  @Delete('/unlink-dispatch-user')
  unlinkDispatchUser(
    @Body() removeIncidentDepartmentDto: RemoveIncidentDepartmentDto,
    @AuthUser() user: User,
  ): Promise<{
    message: string;
  }> {
    return this.incidentService.unlinkDispatchUser(
      removeIncidentDepartmentDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Remove an image from incident',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_REMOVE_IMAGE)
  @Delete('/:id/image')
  removeImage(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() removeImageDto: RemoveImageDto,
    @AuthUser() user: User,
  ): Promise<{
    message: string;
  }> {
    return this.incidentService.removeImage(
      pathParamIdDto.id,
      removeImageDto.image_id,
      user,
    );
  }

  /* Any used in this function is required because data can be dynamic not of one type */
  @MessagePattern('get-incidents-by-filter')
  async sendRequestEventEmail(data: {
    [key: string]: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<Observable<any>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = decryptData(data['body']);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user: any = decryptData(data['user']);

      const incidents =
        await this.incidentService.getIncidentsByFilterCommunication(
          body,
          user,
        );
      return of(incidents);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return of(error?.response);
    }
  }
}
