import {
  Body,
  Controller,
  Get,
  Post,
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
import { Request, Response } from 'express';
import { MessagePattern } from '@nestjs/microservices';
import {
  AuthUser,
  Public,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import {
  RolePermissionGuard,
  WebhookPermission,
} from '@ontrack-tech-group/common/services';
import {
  EventIdQueryDto,
  EventIdsBodyDto,
} from '@ontrack-tech-group/common/dto';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { X_API_KEY, X_API_SECRET } from '@Common/constants';
import { DashboardService } from './dashboard.service';
import {
  CommonFiltersDto,
  ComparisonDto,
  ComparisonEventGraphCsvPdfDto,
  ComparisonEventGraphPdfDto,
  ComparisonEventLineGraphDto,
  ComparisonEventPieGraphDto,
  ComparisonEventsDataDto,
  EventsByStatusQueryDto,
  GetLegendDataDto,
  GetMapPointsDto,
  GraphComparisonDto,
  IncidentDetailDto,
  IncidentListDto,
  IncidentWebhookDto,
  IncidentsByTypeDto,
  IncidentsByTypeMobileDto,
  LiveEventListingDto,
  PinDashboardEventDto,
  PinnedEventDataDto,
  PinnedEventsIncidentsDto,
  WebhookResolvedIncidentNoteDto,
} from './dto';
import {
  comparisonEventsData,
  comparisonEventsDataCsvPdf,
  comparisonEventsDataLineGraph,
  comparisonEventsDataPdf,
  comparisonEventsDataPieGraph,
  eventIds,
  pinDashboardEvent,
} from './body';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary:
      'Pin list of events for dashboard event monitor. Pass updated list for pin or unpin events. If you want to pin another event, send with previous values and new one. If you want to unpin any event then send all event ids except that one.',
  })
  @ApiBody(pinDashboardEvent)
  @Post('/pin-dashboard-events')
  pinDashboardEvents(
    @Body() pinDashboardEventDto: PinDashboardEventDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.pinDashboardEvents(pinDashboardEventDto, user);
  }

  @ApiOperation({
    summary:
      'To send socket to front end from rails side for incident create or update.',
  })
  @Public()
  @ApiHeader(X_API_KEY)
  @ApiHeader(X_API_SECRET)
  @Post('/incident-webhook')
  @UseGuards(WebhookPermission)
  isIncidentCreateOrUpdate(@Body() incidentWebhookDto: IncidentWebhookDto) {
    return this.dashboardService.isIncidentCreateOrUpdate(incidentWebhookDto);
  }

  @ApiOperation({
    summary:
      'To send socket to front end from rails side for resolved incident note on create or update.',
  })
  @Public()
  @ApiHeader(X_API_KEY)
  @ApiHeader(X_API_SECRET)
  @Post('resolved-incident-note-webhook')
  @UseGuards(WebhookPermission)
  isResolvedIncidentNoteCreateOrUpdate(
    @Body()
    webhookResolvedIncidentNoteDto: WebhookResolvedIncidentNoteDto,
  ) {
    return this.dashboardService.isResolvedIncidentNoteCreateOrUpdate(
      webhookResolvedIncidentNoteDto,
    );
  }

  @ApiOperation({
    summary:
      'To fetch data of all events selected for comparison in card view for graph comparison mode.',
  })
  @ApiBody(comparisonEventsData)
  @Post('/comparison-events/cards')
  getAllComparisonEventsData(
    @Body() comparisonEventsDataDto: ComparisonEventsDataDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getAllComparisonEventsData(
      comparisonEventsDataDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch graph data for incidents of selected comparison events.',
  })
  @ApiBody(comparisonEventsDataLineGraph)
  @Post('/comparison-events/line-graph')
  getComparisonEventsIncidentsGraph(
    @Body() comparisonEventLineGraphDto: ComparisonEventLineGraphDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getComparisonEventsIncidentsGraph(
      comparisonEventLineGraphDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch graph data for incidents of selected comparison events.',
  })
  @ApiBody(comparisonEventsDataPieGraph)
  @Post('/comparison-events/pie-graph')
  getComparisonEventsIncidentsGraphPie(
    @Body() comparisonEventPieGraphDto: ComparisonEventPieGraphDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getComparisonEventsIncidentsGraphPie(
      comparisonEventPieGraphDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch csv or pdf for incidents of selected comparison events.',
  })
  @ApiBody(comparisonEventsDataCsvPdf)
  @Post('/comparison-events/csv')
  getComparisonEventsIncidentsCsv(
    @Body() comparisonEventGraphCsvPdfDto: ComparisonEventGraphCsvPdfDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.dashboardService.getComparisonEventsIncidentsCsv(
      comparisonEventGraphCsvPdfDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'To fetch csv or pdf for incidents of selected comparison events.',
  })
  @ApiBody(comparisonEventsDataPdf)
  @Post('/comparison-events/pdf')
  getComparisonEventsIncidentsPdf(
    @Body() comparisonEventGraphPdfDto: ComparisonEventGraphPdfDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.dashboardService.getComparisonEventsIncidentsPdf(
      comparisonEventGraphPdfDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'View division names of all companies of the provided event ids',
  })
  @ApiBody(eventIds)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Post('/division-names/events')
  getDivisionNamesByEventIds(
    @Body() eventIdsBodyDto: EventIdsBodyDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getDivisionNamesByEventIds(
      eventIdsBodyDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'Fetch All Incident Type Names aginst all companies of the provided event ids',
  })
  @ApiBody(eventIds)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Post('/incident-type-names/events')
  getAllIncidentTypeNamesByEventIds(
    @Body() eventIdsBodyDto: EventIdsBodyDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getAllIncidentTypeNamesByEventIds(
      eventIdsBodyDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'Fetch All Department Names aginst all companies of the provided event ids',
  })
  @ApiBody(eventIds)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_NAMES)
  @Post('/department-names/events')
  findAllDepartmentNamesByEventByEventIds(
    @Body() eventIdsBodyDto: EventIdsBodyDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.findAllDepartmentNamesByEventByEventIds(
      eventIdsBodyDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch incident by type count.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_INCIDENTS_BY_TYPE)
  @Get('/incidents-by-type')
  getAllIncidentsByType(
    @Query() incidentsByTypeDto: IncidentsByTypeDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getAllIncidentsByType(
      incidentsByTypeDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'To fetch incident by type and critical incident by type count with percentages.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_INCIDENTS_BY_TYPE)
  @Get('/mobile/incidents-by-type')
  getAllIncidentsByTypeMobile(
    @Query() incidentsByTypeMobileDto: IncidentsByTypeMobileDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getAllIncidentsByTypeMobile(
      incidentsByTypeMobileDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'To fetch count of incidents by categorised as status and priority.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_INCIDENTS_BY_PRIORITY)
  @Get('/incidents-by-priority')
  getAllIncidentsByPriority(
    @Query() commonFiltersDto: CommonFiltersDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getAllIncidentsByPriority(
      commonFiltersDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch legend data that includes different counts.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_LEGEND)
  @Get('/legend')
  getLegendData(
    @Query() getLegendDataDto: GetLegendDataDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getLegendData(getLegendDataDto, user);
  }

  @ApiOperation({
    summary:
      'To fetch event data, company or subcompanies map-points as well also includes counts as well.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_LEGEND)
  @Get('/mobile/map-points')
  getEventsByCount(
    @Query() eventsByStatusQueryDto: EventsByStatusQueryDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.dashboardService.getEventsByCount(
      eventsByStatusQueryDto,
      user,
      res,
    );
  }

  @ApiOperation({
    summary:
      'To fetch data with coordinates for events, parent and sub-companies to show on map.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_MAP_POINTS)
  @Get('/map-points')
  getMapPointsData(
    @Query() getMapPointsDto: GetMapPointsDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.dashboardService.getMapPointsData(getMapPointsDto, user, res);
  }

  @ApiOperation({
    summary: 'To fetch detail of a critical incident.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_INCIDENT_DETAILS)
  @Get('/incident-details')
  getIncidentDetail(
    @Query() incidentDetailDto: IncidentDetailDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getIncidentDetail(
      incidentDetailDto.incident_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch list of critical incidents and counts group as status.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_CRITICAL_INCIDENTS)
  @Get('/critical-incidents')
  getCriticalIncidentsList(
    @Query() incidentListDto: IncidentListDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getCriticalIncidentsList(
      incidentListDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch data with coordinates of incidents to show on map.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_MAP_POINTS)
  @Get('/map-incidents')
  getMapIncidentsList(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getMapIncidentsList(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'To download csv for comparison of events.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_CSV_COMPARISON)
  @Get('/csv-comparison')
  getCsvComparison(
    @Query() comparisonDto: ComparisonDto,
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getCsvComparison(
      comparisonDto,
      req,
      res,
      user,
    );
  }

  @ApiOperation({
    summary: 'To fetch data for event comparison for graph.',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DASHBOARD_VIEW_GRAPH_COMPARISON)
  @Get('/graph-comparison')
  getGraphComparison(
    @Query() comparisonDto: GraphComparisonDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getGraphComparison(comparisonDto, user);
  }

  @ApiOperation({
    summary: 'To fetch list of events for user to pin events.',
  })
  @Get('/live-events')
  liveEventsListing(
    @Query() liveEventListingDto: LiveEventListingDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.liveEventsListing(liveEventListingDto, user);
  }

  @ApiOperation({
    summary: 'To fetch data of pinned event for card view for event monitor.',
  })
  @Get('/pinned-event-data')
  getPinnedEventData(
    @Query() pinnedEventDataDto: PinnedEventDataDto,
    @AuthUser() user: User,
  ) {
    return this.dashboardService.getPinnedEventData(pinnedEventDataDto, user);
  }

  @ApiOperation({
    summary:
      'To fetch data of all pinned events for card view for event monitor.',
  })
  @Get('/pinned-events-data')
  getAllPinnedEventsData(@AuthUser() user: User) {
    return this.dashboardService.getAllPinnedEventsData(user);
  }

  @ApiOperation({
    summary:
      'To fetch data and coordinates of pinned events to be shown on map.',
  })
  @Get('/pinned-events-map-points')
  getPinnedEventsMapPoints(@AuthUser() user: User) {
    return this.dashboardService.getPinnedEventsMapPoints(user);
  }

  @ApiOperation({
    summary: 'To fetch list of pinned events.',
  })
  @Get('/pinned-events')
  getPinnedEvents(@AuthUser() user: User) {
    return this.dashboardService.getPinnedEvents(user);
  }

  @ApiOperation({
    summary: 'To fetch list of incidents of pinned events.',
  })
  @Get('/pinned-events-incidents')
  getPinnedEventsIncidents(
    @Query() pinnedEventsIncidentsDto: PinnedEventsIncidentsDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.dashboardService.getPinnedEventsIncidents(
      pinnedEventsIncidentsDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'View Event details by passing a event_id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  @Get('/event-detail')
  getEventById(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.dashboardService.getEventById(eventIdQueryDto.event_id);
  }

  @ApiOperation({
    summary: 'View division names of all companies of the pinned events',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Get('/division-names')
  getDivisionNames(@AuthUser() user: User) {
    return this.dashboardService.getDivisionNames(user);
  }

  @ApiOperation({
    summary:
      'Fetch All Incident Type Names aginst all companies of the pinned events',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Get('/incident-type-names')
  getAllIncidentTypeNames(@AuthUser() user: User) {
    return this.dashboardService.getAllIncidentTypeNames(user);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_NAMES)
  @Get('/department-names')
  findAllDepartmentNamesByEvent(@AuthUser() user: User) {
    return this.dashboardService.findAllDepartmentNamesByEvent(user);
  }

  /**
   * Communication Messages
   */

  @MessagePattern('company')
  async companyCreatedOrUpdated(data: { body: string; user: string }) {
    return this.dashboardService.companyCreatedOrUpdated(data);
  }

  @MessagePattern('event')
  async eventCreatedOrUpdated(data: { body: string; user: string }) {
    return this.dashboardService.eventCreatedOrUpdated(data);
  }

  @MessagePattern('update-incident')
  async incidentUpdated(data: { body: string; user?: string }) {
    const _body = decryptData(data.body) as unknown as IncidentWebhookDto;
    return this.dashboardService.isIncidentCreateOrUpdate(_body);
  }

  @MessagePattern('resolved-incident-note')
  async resolvedIncidentNoteUpdated(data: { body: string; user: string }) {
    return this.dashboardService.resolvedIncidentNoteUpdated(data);
  }

  /**
   * Scripts
   */

  // @Get('location-script')
  // getLocationCoordinates() {
  //   return this.dashboardService.getLocationCoordinates();
  // }

  // @Get('incident-type-id-script')
  // mappingIncidentTypeIds() {
  //   return this.dashboardService.mappingIncidentTypeIds();
  // }

  // @Get('incident-type-create-script')
  // createIncidentTypes() {
  //   return this.dashboardService.createIncidentTypes();
  // }
}
