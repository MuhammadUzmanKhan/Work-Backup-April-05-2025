import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { MessagePattern } from '@nestjs/microservices';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Res,
  Req,
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
  COMPANY_ID_API_HEADER,
  MILLI_SECONDS_FORTY_EIGHT_HOURS,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PaginationDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { DashboardDropdownsQueryDto, CompanyIdQueryDto } from '@Common/dto';
import { QueuesService } from '@Modules/queues/queues.service';
import {
  EventIdPathDto,
  WorkforceEventQueryParams,
  AddCommentDto,
  UploadEventAttachmentDto,
  CreateEventDto,
  EventNameQueryParams,
  EventQueryParams,
  GetEventByIdDto,
  GetEventCardViewCsvParams,
  EventMultipleStatusQueryParams,
  EventMultipleStatusBodyData,
  GetEventCardViewCsvBody,
  UpdateEventDto,
  UpdateEventStatusDto,
  EventNamesQueryParams,
  EventRequestStatusParams,
  PreEventChecklistPdfDto,
  DosChecklistPdfDto,
  UserCompanyEventQueryParams,
  GetModuleCountForAnEvent,
  UploadEventDto,
  GetEventCommentDto,
} from './dto';
import { EventService } from './event.service';
import {
  createRequestEvent,
  dayOfShowChecklistPdf,
  preEventChecklistPdf,
  createTemporaryEventQueue,
} from './body';
import { CreateTemporaryEventDto } from '@Modules/event/dto/temporary-queue.dto';

@ApiTags('Events')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly queueService: QueuesService,
  ) {}

  @Post('')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CREATE)
  createEvent(
    @Query() companyIdQueryDto: CompanyIdQueryDto,
    @Body() createEventDto: CreateEventDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.createEvent(
      companyIdQueryDto.company_id,
      createEventDto,
      user,
    );
  }

  @Post('/request-event')
  @UseGuards(RolePermissionGuard)
  @ApiBody(createRequestEvent)
  @RolePermissions(UserAccess.EVENT_CREATE_REQUESTED)
  createEventRequest(
    @Query() companyIdQueryDto: CompanyIdQueryDto,
    @Body() createEventDto: CreateEventDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.createEventRequest(
      companyIdQueryDto.company_id,
      createEventDto,
      user,
    );
  }

  @Post('status')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventsForStatus(
    @Query() eventQuery: EventMultipleStatusQueryParams,
    @AuthUser() user: User,
    @Body() statusArray: EventMultipleStatusBodyData,
  ) {
    return this.eventService.getAllEventsForStatuses(
      eventQuery,
      user,
      statusArray,
    );
  }

  @Post('/cardview-csv')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getEventCardViewCsv(
    @Query() eventQuery: GetEventCardViewCsvParams,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: GetEventCardViewCsvBody,
  ) {
    return this.eventService.getEventCardViewCsv(
      eventQuery,
      body,
      user,
      res,
      req,
    );
  }

  @Post('/upload-attachment')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPLOAD_ATTACHMENT)
  uploadEventAttachment(
    @Body() uploadEventAttachmentDto: UploadEventAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.uploadEventAttachment(
      uploadEventAttachmentDto,
      user,
    );
  }

  @Post('/add-comment')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_ADD_COMMENT)
  addEventComment(
    @Body() addCommentDto: AddCommentDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.addEventComment(addCommentDto, user);
  }

  @Post('pre-event-checklist')
  @ApiBody(preEventChecklistPdf)
  getPreEventChecklist(
    @Body() preEventChecklistPdfDto: PreEventChecklistPdfDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.eventService.getPreEventChecklist(
      preEventChecklistPdfDto,
      res,
      req,
    );
  }

  @Post('day-of-show-checklist')
  @ApiBody(dayOfShowChecklistPdf)
  getDayOfShowChecklist(
    @Body() dosChecklistPdfDto: DosChecklistPdfDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.eventService.getDayOfShowChecklist(
      dosChecklistPdfDto,
      res,
      req,
    );
  }

  @ApiOperation({
    summary: 'Upload the events using csv data',
  })
  @Post('/upload')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPLOAD)
  uploadEvent(@Body() uploadEventDto: UploadEventDto, @AuthUser() user: User) {
    return this.eventService.uploadEvent(uploadEventDto, user);
  }

  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW, UserAccess.EVENT_DOWNLOAD_CSV_PDF)
  getAllEvents(
    @Query() eventQuery: EventQueryParams,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.eventService.getAllEventsV1(eventQuery, user, res, req);
  }

  @Get('/:id/date-status')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getEventStatusDates(
    @Param() eventIdPathDto: EventIdPathDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getEventStatusDates(eventIdPathDto.id, user);
  }

  @Get('/v1')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW, UserAccess.EVENT_DOWNLOAD_CSV_PDF)
  getAllEventsV1(
    @Query() eventQuery: EventQueryParams,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.eventService.getAllEvents(eventQuery, user, res, req);
  }

  @Get('/event-status-count')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventsStatusCount(
    @Query() eventQuery: EventQueryParams,
    @AuthUser() user: User,
  ) {
    return this.eventService.getAllEventsStatusCount(eventQuery, user);
  }

  @Get('/workforce')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_USER_ASSIGNED_EVENTS)
  getAllEventsForWorkforce(
    @Query() workForceEventQuery: WorkforceEventQueryParams,
  ) {
    return this.eventService.getAllEventsForWorkforce(workForceEventQuery);
  }

  @Get('/user-company-events')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_USER_COMPANY_EVENTS)
  getAllEventsUserListing(
    @Query() userCompanyEventQueryParams: UserCompanyEventQueryParams,
  ) {
    return this.eventService.getAllEventsUserListing(
      userCompanyEventQueryParams,
    );
  }

  @Get('/names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventNames(
    @Query() eventNameQuery: EventNamesQueryParams,
    @AuthUser() user: User,
  ) {
    return this.eventService.getAllEventNames(eventNameQuery, user);
  }

  @Get('/:id/attachments')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_ATTACHMENT)
  getEventAttachments(@Param('id') id: string, @AuthUser() user: User) {
    return this.eventService.getEventAttachments(+id, user);
  }

  @Get('/:id/comments')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_CHANGE_LOGS_AND_COMMENTS)
  getEventComments(
    @Param() eventIdPathDto: EventIdPathDto,
    @Query() getEventCommentDto: GetEventCommentDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getEventComments(
      eventIdPathDto.id,
      getEventCommentDto,
      user,
    );
  }

  @Get('/:id/change-logs')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_CHANGE_LOGS_AND_COMMENTS)
  getEventChangeLogs(
    @Param() eventIdPathDto: EventIdPathDto,
    @Query() paginationDto: PaginationDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getEventChangeLogs(
      eventIdPathDto.id,
      paginationDto,
      user,
    );
  }

  @Get('/event-statuses')
  getEventStatuses() {
    return this.eventService.getEventStatuses();
  }

  @Get('/event-genre')
  getEventGenre() {
    return this.eventService.getEventGenre();
  }

  @Get('/venue-names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllVenues(@Query() query: EventNameQueryParams, @AuthUser() user: User) {
    return this.eventService.getAllVenues(query.company_id, user);
  }

  @Get('/event-countries')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventCountries(
    @Query() query: EventNameQueryParams,
    @AuthUser() user: User,
  ) {
    return this.eventService.getAllEventCountries(query.company_id, user);
  }

  @Get('/unreads-count')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllUnreadsCount(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.eventService.getAllUnreadsCount(eventIdQueryDto.event_id);
  }

  @Get('/event-names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventNamesOnly(
    @Query() dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getAllEventNamesOnly(
      dashboardDropdownsQueryDto,
      user,
    );
  }

  @Get('/requested-events')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_REQUESTED)
  getAllRequestedEvents(
    @Query() eventRequestQuery: EventRequestStatusParams,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.eventService.getAllRequestedEvents(
      eventRequestQuery,
      user,
      res,
      req,
    );
  }

  @Get(':id/module-count')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getModuleCountByEventId(
    @Query() getModuleCountForAnEvent: GetModuleCountForAnEvent,
    @Param() eventIdPathDto: EventIdPathDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getModuleCountByEventId(
      getModuleCountForAnEvent,
      eventIdPathDto.id,
      user,
    );
  }

  // for showing event details on CAD Preview
  @Get('/:id/cad-preview')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getEventForCadPreview(
    @Param() eventIdPathDto: EventIdPathDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.getEventForCadPreview(eventIdPathDto.id, user);
  }

  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getEventById(
    @Param() eventIdPathDto: EventIdPathDto,
    @Query() params: GetEventByIdDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.eventService.getEventById(eventIdPathDto.id, user, req, params);
  }

  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.EVENT_UPDATE,
    UserAccess.INCIDENT_UPDATE_DIALER_LAYOUT,
  )
  updateEvent(
    @Param() eventIdPathDto: EventIdPathDto,
    @Body() updateEventDto: UpdateEventDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.updateEvent(
      eventIdPathDto.id,
      updateEventDto,
      user,
    );
  }

  @Put('/:id/status')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPDATE_STATUS)
  updateEventStatus(
    @Param() eventIdPathDto: EventIdPathDto,
    @Body() updateEventStatusDto: UpdateEventStatusDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.updateEventStatus(
      eventIdPathDto.id,
      updateEventStatusDto,
      user,
    );
  }

  @Put('/:id/pin')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_PIN)
  pinEvent(@Param() eventIdPathDto: EventIdPathDto, @AuthUser() user: User) {
    return this.eventService.pinEvent(eventIdPathDto.id, user);
  }

  @Put('/:id/demo-event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPDATE)
  demoEvent(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.eventService.demoEvent(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'Update the Restrict Access' })
  @Put('/:id/restrict-access')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_RESTRICT_ACCESS)
  updateRestrictAccess(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.updateRestrictAccess(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'Update the Division Lock Service Flag' })
  @Put('/:id/division-lock')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_DIVISION_LOCK)
  updateDivisionLock(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.eventService.updateDivisionLock(pathParamIdDto.id, user);
  }

  @Delete('/:id/attachment/:attachmentId')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_DELETE_ATTACHMENT)
  deleteEventAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @AuthUser() user: User,
  ) {
    return this.eventService.deleteEventAttachment(+id, +attachmentId, user);
  }

  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_ARCHIVE)
  deleteEvent(@Param() eventIdPathDto: EventIdPathDto) {
    return this.eventService.deleteEvent(eventIdPathDto.id);
  }

  @Post('/temporary-queue-creator')
  @UseGuards(RolePermissionGuard)
  @ApiBody(createTemporaryEventQueue)
  @RolePermissions(UserAccess.EVENT_VIEW)
  temporaryQueueCreator(
    @AuthUser() user: User,
    @Body() createTemporaryEvent: CreateTemporaryEventDto,
  ) {
    const delay: number =
      createTemporaryEvent.delay || MILLI_SECONDS_FORTY_EIGHT_HOURS;
    return this.queueService.tempScheduleEventStatus(user, delay);
  }

  @MessagePattern('get-event-by-id')
  async getEventByIdMessage(data: any): Promise<Observable<any>> {
    // This try catch should not be deleted.
    try {
      const eventId: number = parseInt(decryptData(data.body));
      const userStingData = JSON.stringify(decryptData(data.user));
      const user = JSON.parse(userStingData);

      const event = await this.eventService.getEventById(
        eventId,
        user,
        null,
        null,
        {
          useMaster: true,
        },
      );

      return of(event);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('schedule-event-status')
  async scheduleEventStatus(data: any): Promise<Observable<any>> {
    // This try catch should not be deleted.
    try {
      const eventId: number = parseInt(decryptData(data.body));
      const userStingData = JSON.stringify(decryptData(data.user));
      const user = JSON.parse(userStingData);

      const event = await this.eventService.getEventById(eventId, user);

      this.queueService.scheduleEventStatus(event, user);

      return of(event);
    } catch (error) {
      return of(error.response);
    }
  }
}
