import { CreateOptions, Op, UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Request, Response } from 'express';
import NodeGeocoder from 'node-geocoder';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  EventGenre,
  EventStatus,
  EventStatusAPI,
  EventType,
  PolymorphicType,
  SortBy,
  ERRORS,
  CommentableTypes,
  RolesNumberEnum,
  CsvOrPdf,
  PdfTypes,
  EventSortingColumns,
  Options,
  notOntrackRole,
  isUserHaveGlobalRole,
  notUserHaveOntrackRole,
  isUserHaveOntrackRole,
  isOntrackRole,
  Editor,
  RESPONSES,
  NotificationModule,
  NotificationType,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  successInterceptorResponseFormat,
  getScopeAndCompanyIds,
  getPageAndPageSizeWithDefault,
  withCompanyScope,
  getSubCompaniesOfGlobalAdmin,
  isCompanyExist,
  getCompanyScope,
  handleEventStatusCount,
  isUpperRoles,
  throwCatchError,
  isEventExist,
  getPageAndPageSizeWithCsvPdfParam,
} from '@ontrack-tech-group/common/helpers';
import {
  User,
  Event,
  Company,
  EventUser,
  Image,
  Incident,
  Message,
  LostAndFound,
  Notification,
  ServiceRequest,
  UserCompanyRole,
  Role,
} from '@ontrack-tech-group/common/models';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  PusherService,
  CommunicationService,
  AnalyticCommunicationService,
  getReportsFromLambda,
  ChangeLogService,
  UsersPinsService,
  TranslateService,
  ReportingCommunicationService,
} from '@ontrack-tech-group/common/services';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ImageService } from '@Modules/image/image.service';
import { SubcompaniesWithEvents } from '@Modules/company/dto/subcompany-events.dto';
import { CompanyService } from '@Modules/company/company.service';
import { QueuesService } from '@Modules/queues/queues.service';
import { EventCadService } from '@Modules/event-cads/event-cad.service';
import {
  REQUEST_STATUS,
  EventUploadCsv,
  REQUEST_EVENT_TYPE,
} from '@Common/constants';
import { DashboardDropdownsQueryDto } from '@Common/dto';
import {
  formatDate,
  getCompanyIdsWithCheckPermission,
  smsEmailForEventNotifications,
} from '@Common/helpers';
import {
  CreateEventDto,
  EventNamesQueryParams,
  EventQueryParams,
  WorkforceEventQueryParams,
  UpdateEventDto,
  UpdateEventStatusDto,
  UploadEventAttachmentDto,
  AddCommentDto,
  GetEventByIdDto,
  GetEventCardViewCsvParams,
  GetEventCardViewCsvBody,
  EventMultipleStatusBodyData,
  EventMultipleStatusQueryParams,
  EventRequestStatusParams,
  PreEventChecklistPdfDto,
  DosChecklistPdfDto,
  UserCompanyEventQueryParams,
  GetModuleCountForAnEvent,
  UploadEventDto,
  GetEventCommentDto,
} from './dto';
import {
  getSubCompanies,
  eventActiveModulesAttributes,
  eventNamesAttributes,
  eventNamesWhere,
  EventStatusWhereQuery,
  EventUserModel,
  getAllEventsForStatusesInclude,
  getAllEventsHelper,
  getCsvForAllEventsListing,
  getEventNameSearch,
  getEventsOfSubcompanyWhereQuery,
  getPdfForSpecificEvent,
  getRequestedEventCount,
  getWorkforceEventWhereQuery,
  getUserCompanyEventWhere,
  getOrderOfUserCompanyEvents,
  includeUserCompanyEvents,
  getSpecificModuleCounts,
  getEventsWhereQuery,
  parseCsvAndSaveEvents,
  sendResponseForUploadedEvent,
  sendEventUploadUpdate,
  updateEventLocation,
  getEventByIdHelper,
  sendDeniedRequestEvent,
  eventDefaultTimes,
  eventMetaCounts,
  getAllEventsHelperV1,
  eventCadsCount,
  isEventCads,
  isCads,
  moduleCounts,
  createEventInitialData,
  sendEmailOnRequestStatusChange,
  destroyAssociatedData,
  getEventCadPreviewInclude,
} from './helpers';

@Injectable()
export class EventService {
  private geocoder: NodeGeocoder;

  constructor(
    private readonly changeLogService: ChangeLogService,
    private readonly imageService: ImageService,
    @Inject(forwardRef(() => CompanyService)) // Resolving circular dependency
    private readonly companyService: CompanyService,
    private readonly pusherService: PusherService,
    private readonly userPinsService: UsersPinsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly queuesService: QueuesService,
    private readonly communicationService: CommunicationService,
    private readonly analyticCommunicationService: AnalyticCommunicationService,
    private readonly reportingCommunicationService: ReportingCommunicationService,
    @Inject(forwardRef(() => EventCadService)) // Resolving circular dependency
    private readonly eventCadService: EventCadService,
    private readonly sequelize: Sequelize,
    private readonly translateService: TranslateService,
  ) {
    // using NodeGeocoder for extracting City, State, Country from Whole Location string
    const options: NodeGeocoder.Options = {
      provider: 'google',
      apiKey: this.configService.get('GOOGLE_MAPS_API_KEY'),
      formatter: null,
    };
    this.geocoder = NodeGeocoder(options);
  }

  async createEvent(
    company_id: number,
    createEventDto: CreateEventDto,
    user: User,
  ) {
    const {
      status = 'upcoming',
      event_type = 'event',
      event_location,
      event_category,
      public_start_date,
      public_end_date,
      event_cads,
      start_date,
      end_date,
    } = createEventDto;

    let newEvent: Event;

    const company = await isCompanyExist(company_id);

    const transaction = await this.sequelize.transaction();

    try {
      newEvent = await Event.create(
        {
          ...createEventDto,
          company_id,
          status:
            status &&
            (user['role'] === RolesNumberEnum.SUPER_ADMIN ||
              user['role'] === RolesNumberEnum.ONTRACK_MANAGER)
              ? EventStatus[status.toUpperCase()]
              : null,
          event_type: event_type
            ? Object.keys(EventType).indexOf(event_type.toUpperCase())
            : null,
          short_event_location: event_location
            ? await updateEventLocation(event_location, this.geocoder)
            : null,
          event_category: event_category || company.category,
          dialer_layout: event_category || company.category,
          region_id: company.region_id,
          start_date: start_date || public_start_date,
          end_date: end_date || public_end_date,
          event_access_lock: true,
          ...eventDefaultTimes,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      // Create Cad
      await this.eventCadService.bulkCreateEventCad(
        event_cads,
        newEvent.id,
        user,
        transaction,
        { useMaster: true },
      );

      await createEventInitialData(
        this.configService,
        user,
        transaction,
        newEvent,
      );

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ EventService ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    // Fetch and return the full details of the created event
    const createdEvent = await this.getEventById(
      newEvent.id,
      user,
      null,
      null,
      {
        useMaster: true,
      },
    );

    // This is for sending created event in sockets so newly created event can be visible by everyone on frontend real-time
    this.pusherService.sendUpdatedEvent(createdEvent as Event);

    // This is for automation of event statuses based on start or end date
    this.queuesService.scheduleEventStatus(createdEvent, user);

    // This is for sending update to dashboard/analytics service
    try {
      this.analyticCommunicationService.analyticCommunication(
        { eventId: createdEvent.id, isNewEvent: true },
        'event',
        user,
      );
    } catch (err) {
      console.log('🚀 ~ Error on Communcation with Analytics ~ err:', err);
    }

    return createdEvent;
  }

  async createEventRequest(
    company_id: number,
    createEventDto: CreateEventDto,
    user: User,
  ) {
    const { id } = user;
    const {
      status,
      event_type = 'event',
      event_location,
      event_cads,
      event_category,
      start_date,
      end_date,
      public_start_date,
      public_end_date,
    } = createEventDto;
    let newEvent: Event;

    const request_status = REQUEST_STATUS.REQUESTED;

    const company = await isCompanyExist(company_id);

    // check if user have correct company access
    await getCompanyScope(user, company_id);

    const transaction = await this.sequelize.transaction();

    try {
      newEvent = await Event.create(
        {
          ...createEventDto,
          company_id,
          status: status ? EventStatus[status.toUpperCase()] : null,
          event_type: event_type
            ? Object.keys(EventType).indexOf(event_type.toUpperCase())
            : null,
          short_event_location: event_location
            ? await updateEventLocation(event_location, this.geocoder)
            : null,
          request_status,
          event_category: event_category || company.category,
          requestee_id: id,
          region_id: company.region_id,
          start_date: start_date || public_start_date,
          end_date: end_date || public_end_date,
          ...eventDefaultTimes,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      // Create Cad
      await this.eventCadService.bulkCreateEventCad(
        event_cads,
        newEvent.id,
        user,
        transaction,
        { useMaster: true },
      );

      await createEventInitialData(
        this.configService,
        user,
        transaction,
        newEvent,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const createdEvent = (
      await this.getEventById(newEvent.id, user, null, null, {
        useMaster: true,
      })
    ).get({
      plain: true,
    });

    // update the date as per the format of front end
    const startDate = formatDate(createdEvent.public_start_date);
    const endDate = formatDate(createdEvent.public_end_date);

    const eventDates = `${startDate} - ${endDate}`;

    // Slack Update on Request Event
    try {
      let requesterInfo = '';
      const { requestee_name, requestee_email } = createdEvent;

      if (requestee_name || requestee_email) {
        requesterInfo = `(Requested by: ${requestee_name ? requestee_name : 'N/A'}${requestee_email ? ` - ${requestee_email}` : ''})\n\n`;
      }

      await this.communicationService.communication(
        {
          text: `<!channel> *[Update]*\n\n${requesterInfo}New *EVENT REQUEST* from ${company.name}: ${createdEvent.name} - ${eventDates}. :tada:`,
        },
        'slack-event-update',
      );
    } catch (err) {
      console.log(
        '🚀 ~ Error on Slack Event Update - Request Event ~ err:',
        err,
      );
    }

    // This is for sending created event in sockets so newly created event can be visible by everyone on frontend real-time
    this.pusherService.sendUpdatedEvent(createdEvent as Event);

    // This is for sending requested event counts
    const requestedEventCount = await getRequestedEventCount({
      useMaster: true,
    });

    this.pusherService.requestedEventCount(requestedEventCount);

    return createdEvent;
  }

  async getAllEventsForStatuses(
    filters: EventMultipleStatusQueryParams,
    user: User,
    multipleStatusArray: EventMultipleStatusBodyData,
  ) {
    const { company_id, sort_column, order } = filters;

    const [page, page_size] = getPageAndPageSizeWithDefault(
      filters.page,
      filters.page_size,
    );
    const companyAndSubcompaniesIds = await getCompanyIdsWithCheckPermission(
      user,
      company_id,
      this.companyService,
    );

    if (notOntrackRole(user['role']) && !company_id) {
      throw new BadRequestException(ERRORS.COMPANY_ID_IS_REQUIRED);
    }

    const where = await EventStatusWhereQuery(
      multipleStatusArray,
      filters,
      companyAndSubcompaniesIds,
      user,
    );

    // fetching all events
    const events = await Event.findAll({
      where,
      attributes: [
        'id',
        'name',
        'short_event_location',
        'event_location',
        'venue_name',
        'demo_event',
        'region_id',
        'event_category',
        'public_start_time',
        'public_end_time',
        'public_start_date',
        'public_end_date',
        'venue_id',
        [Event.getStatusNameByKey, 'status'],
        [Sequelize.literal('company.name'), 'company_name'],
        moduleCounts(user),
        ...eventActiveModulesAttributes,
      ],
      include: getAllEventsForStatusesInclude(
        user,
        isUpperRoles(Number(user['role'])),
        true,
      ),
      limit: page_size,
      offset: page_size * page,
      subQuery: false,
      order: [
        Event.orderByStatusSequence,
        [sort_column || 'public_start_date', order || SortBy.ASC],
      ],
    });

    const statusCount = await Event.findAll({
      where: await EventStatusWhereQuery(
        multipleStatusArray,
        filters,
        companyAndSubcompaniesIds,
        user,
        true,
      ),
      attributes: [
        [
          Sequelize.literal(`
          CASE status
            WHEN 3 THEN 'upcoming'
            WHEN 2 THEN 'in_progress'
            WHEN 1 THEN 'completed'
            WHEN 0 THEN 'on_hold'
            WHEN NULL THEN 'other'
          END
          `),
          'status',
        ],
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
      ],
      include: !isUpperRoles(Number(user['role']))
        ? [EventUserModel(user.id)]
        : [],
      group: [`"Event"."status"`, `"Event"."id"`],
      raw: true,
      subQuery: false,
    });

    return {
      data: events,
      statusCount,
    };
  }

  async getEventCardViewCsv(
    filters: GetEventCardViewCsvParams,
    body: GetEventCardViewCsvBody,
    user: User,
    res: Response,
    req: Request,
  ) {
    const page = 0;
    const page_size = 20; // It will always be 20
    const pages = { ...body }; // These are page numbers of each statuses coming in API request body.

    const allEvents = [];
    for (let i = 0; i < Object.keys(EventStatusAPI).length; i++) {
      filters['status'] = EventStatusAPI[Object.keys(EventStatusAPI)[i]];

      const { events } = await getAllEventsHelper(
        filters,
        user,
        page,
        page_size * pages[`${filters['status']}`],
        this.companyService,
      );
      allEvents.push(...events);
    }
    // csv work
    return await getCsvForAllEventsListing(
      allEvents,
      req,
      res,
      this.httpService,
    );
  }

  async uploadEventAttachment(
    uploadEventAttachmentDto: UploadEventAttachmentDto,
    user: User,
  ) {
    const { event_id, url, name } = uploadEventAttachmentDto;

    // if user has access to this event
    await withCompanyScope(user, event_id);

    // create image entry
    const createdImage = await this.imageService.createImage(
      event_id,
      PolymorphicType.EVENT,
      url,
      name,
      user.id,
      user.name,
    );

    return {
      id: createdImage.id,
      url: createdImage.url,
      name: createdImage.name,
    };
  }

  async addEventComment(addCommentDto: AddCommentDto, user: User) {
    const { event_id, text, user_ids } = addCommentDto;

    // checking if user have correct access
    const [company_id] = await withCompanyScope(user, event_id);

    const event = await getEventByIdHelper(event_id, user);

    const data = {
      text,
      event_id,
      commentable_type: CommentableTypes.EVENT,
      commentable_id: event_id,
    };

    const createdComment = await this.communicationService.communication(
      data,
      'create-comment',
      user,
    );

    if (user_ids?.length) {
      const message = `'${user.name}' mentioned you in a event '${event.name}'`;
      const message_html = `<strong>${user.name}</strong> mentioned you in a event <strong>${event.name}</strong>`;
      const emailSubject = 'You have been mentioned in an Event Comment';

      const notificationData = {
        user_ids,
        event_id,
        company_id,
        event: event.get({ plain: true }),
        communicationService: this.communicationService,
        message,
        message_html,
        subject: emailSubject,
        module: NotificationModule.EVENT,
        type: NotificationType.MENTION,
        sub_type: 'comment',
        comment_id: createdComment.id,
      };

      await smsEmailForEventNotifications(notificationData, this.pusherService);
    }
    return createdComment;
  }

  async getPreEventChecklist(
    preEventChecklistPdfDto: PreEventChecklistPdfDto,
    res: Response,
    req: Request,
  ) {
    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      { ...preEventChecklistPdfDto },
      CsvOrPdf.PDF,
      PdfTypes.PRE_EVENT_CHECKLIST,
    );

    return res.send(response.data);
  }

  async getDayOfShowChecklist(
    dosChecklistPdfDto: DosChecklistPdfDto,
    res: Response,
    req: Request,
  ) {
    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      { ...dosChecklistPdfDto },
      CsvOrPdf.PDF,
      PdfTypes.DAY_OF_SHOW_CHECKLIST,
    );

    return res.send(response.data);
  }

  async uploadEvent(uploadEventDto: UploadEventDto, user: User) {
    const response = await parseCsvAndSaveEvents(
      uploadEventDto,
      this.httpService,
      this.geocoder,
      user,
      this.queuesService,
    );

    const { message, statusCode } = await sendResponseForUploadedEvent([
      response,
    ] as EventUploadCsv[]);

    sendEventUploadUpdate(message, this.pusherService);

    return { message, statusCode };
  }

  async getAllEvents(
    filters: EventQueryParams,
    user: User,
    res: Response,
    req: Request,
  ) {
    let isEventsAssigned: Event[];

    const [page, page_size] = getPageAndPageSize(
      filters.page,
      filters.page_size,
    );

    // Created a helper function here for reuse the code of finding events, their count, etc.
    const {
      events,
      totalEvents,
      companyAndSubcompaniesIds,
      statusCount,
      _subCompanies,
    } = await getAllEventsHelper(
      filters,
      user,
      page,
      page_size,
      this.companyService,
      true,
      filters.csv,
    );

    // csv work
    if (filters.csv) {
      return await getCsvForAllEventsListing(
        events,
        req,
        res,
        this.httpService,
      );
    }

    const company_ids =
      user['is_global_admin'] ||
      user['is_global_manager'] ||
      user['is_regional_manager'] ||
      user['is_regional_admin']
        ? await getSubCompaniesOfGlobalAdmin(user)
        : [user['company_id']];

    // getting flag for if any event is assigned to logged in user
    if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
      isEventsAssigned = await Event.findAll({
        where: {
          company_id: {
            [Op.in]: company_ids,
          },
        },
        attributes: ['id'],
        include: [
          {
            model: EventUser,
            where: { user_id: user.id },
            attributes: ['id'],
          },
        ],
        benchmark: true,
      });
    }

    const { companiesCount, subCompaniesCount, pinnedIncidentTypesCount } =
      await eventMetaCounts(
        user,
        companyAndSubcompaniesIds,
        _subCompanies,
        filters.company_id,
      );

    const is_events_assgined =
      user['is_super_admin'] || user['is_ontrack_manager']
        ? true
        : !!isEventsAssigned.length;

    return res.send(
      successInterceptorResponseFormat({
        data: events,
        pagination: calculatePagination(
          totalEvents.length,
          page_size || filters.csv
            ? page_size
            : parseInt(this.configService.get('PAGE_LIMIT')),
          page || filters.csv
            ? page * page_size
            : parseInt(this.configService.get('PAGE')),
        ),
        totalCompanies: companyAndSubcompaniesIds.length,
        statusCount,
        counts: {
          is_events_assgined,
          companiesCount,
          subCompaniesCount,
          pinnedIncidentTypesCount,
        },
      }),
    );
  }

  async getEventStatusDates(id: number, user: User) {
    // checking if user have correct access
    const [company_id] = await withCompanyScope(user, id, { useMaster: true });

    const incidentDates = await Incident.findAll({
      where: {
        event_id: id,
        company_id,
      },
      attributes: [
        [
          Sequelize.literal(
            `DISTINCT (CASE WHEN logged_date_time is null THEN created_at ELSE logged_date_time END)::DATE`,
          ),
          'createdAt',
        ],
      ],
      order: ['createdAt'],
      raw: true,
    });

    const data: { [key: string]: boolean } = {};

    incidentDates.forEach((incidentDate: Incident) => {
      data[incidentDate.createdAt] = true;
    });

    return data;
  }

  async getAllEventsV1(
    filters: EventQueryParams,
    user: User,
    res: Response,
    req: Request,
  ) {
    const { company_id, csv, page, page_size } = filters;
    let isEventAssigned: Event;

    const [_page, _page_size] = getPageAndPageSizeWithCsvPdfParam(
      page,
      page_size,
    );

    // Created a helper function here for reuse the code of finding events, their count, etc.
    const {
      events,
      totalEvents,
      companyAndSubcompaniesIds,
      statusCount,
      _subCompanies,
    } = await getAllEventsHelperV1(
      filters,
      user,
      _page,
      _page_size,
      this.companyService,
      csv,
    );

    // csv work
    if (csv) {
      return await getCsvForAllEventsListing(
        events as unknown as Event[],
        req,
        res,
        this.httpService,
      );
    }

    const company_ids = isUserHaveGlobalRole(user)
      ? await getSubCompaniesOfGlobalAdmin(user)
      : [user['company_id']];

    // getting flag for if any event is assigned to logged in user
    if (notUserHaveOntrackRole(user)) {
      isEventAssigned = await Event.findOne({
        where: {
          company_id: {
            [Op.in]: company_ids,
          },
        },
        attributes: ['id'],
        include: [
          {
            model: EventUser,
            where: { user_id: user.id },
            attributes: ['id'],
          },
        ],
        benchmark: true,
      });
    }

    const { companiesCount, subCompaniesCount, pinnedIncidentTypesCount } =
      await eventMetaCounts(
        user,
        companyAndSubcompaniesIds,
        _subCompanies,
        company_id,
      );

    return res.send(
      successInterceptorResponseFormat({
        data: events,
        pagination: calculatePagination(totalEvents, _page_size, _page),
        totalCompanies: companiesCount + subCompaniesCount,
        statusCount,
        counts: {
          is_events_assgined: isUserHaveOntrackRole(user)
            ? true
            : !!isEventAssigned,
          companiesCount,
          subCompaniesCount,
          pinnedIncidentTypesCount,
        },
      }),
    );
  }

  async getAllEventsStatusCount(filters: EventQueryParams, user: User) {
    const { company_id } = filters;

    if (notOntrackRole(user['role']) && !company_id) {
      throw new BadRequestException(ERRORS.COMPANY_ID_IS_REQUIRED);
    }

    const companyAndSubcompaniesIds = await getCompanyIdsWithCheckPermission(
      user,
      company_id,
      this.companyService,
    );

    const statusCount = await Event.findAll({
      where: await getEventsWhereQuery(
        filters,
        companyAndSubcompaniesIds,
        false,
        user,
        false,
      ),
      attributes: [
        [
          Sequelize.literal(`CASE
            WHEN status = 3 OR status IS NULL THEN 'upcoming'
            WHEN status = 2 THEN 'in_progress'
            WHEN status = 1 THEN 'completed'
            WHEN status = 0 THEN 'on_hold'
          END`),
          'status',
        ],
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
      ],
      include: getAllEventsForStatusesInclude(
        user,
        isUpperRoles(Number(user['role'])),
      ),
      group: [`"company"."id"`, `"Event"."status"`],
      raw: true,
    });

    return {
      data: handleEventStatusCount({ statusCount }),
    };
  }

  async getAllEventsForWorkforce(filters: WorkforceEventQueryParams) {
    const { user_id, order, sort_column } = filters;

    const [page, page_size] = getPageAndPageSizeWithDefault(
      filters.page,
      filters.page_size,
    );

    const eventCounts = await Event.findAndCountAll({
      where: getWorkforceEventWhereQuery(filters),
      attributes: ['id', 'name', 'created_at'],
      include: [
        {
          model: EventUser,
          where: { user_id },
          attributes: [],
          include: [
            {
              model: User,
              attributes: [],
              include: [
                {
                  model: UserCompanyRole,
                  attributes: [],
                  include: [
                    {
                      model: Role,
                      attributes: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order:
        sort_column === EventSortingColumns.ROLE_NAME
          ? [
              [
                { model: EventUser, as: 'event_users' },
                { model: User, as: 'users' },
                { model: UserCompanyRole, as: 'users_companies_roles' },
                { model: Role, as: 'role' },
                'name',
                order || SortBy.DESC,
              ],
            ]
          : [[sort_column || 'createdAt', order || SortBy.DESC]],
      limit: page_size,
      offset: page_size * page,
      distinct: true,
    });

    const eventIds = eventCounts.rows.map((event) => event.id);

    const events = await Event.findAll({
      where: {
        id: { [Op.in]: eventIds },
      },
      attributes: [
        'id',
        'name',
        'venue_name',
        'short_event_location',
        'start_date',
        'end_date',
        'event_location',
        'company_id',
        'region_id',
        [
          Sequelize.literal(
            '"event_users->users->users_companies_roles->role"."name"',
          ),
          'role_name',
        ],
        [Sequelize.literal('company.name'), 'company_name'],
      ],
      include: [
        {
          model: EventUser,
          where: { user_id },
          attributes: [],
          include: [
            {
              model: User,
              attributes: [],
              include: [
                {
                  model: UserCompanyRole,
                  attributes: [],
                  include: [
                    {
                      model: Role,
                      attributes: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Company,
          attributes: [],
        },
      ],
      subQuery: false,
      order:
        sort_column === EventSortingColumns.ROLE_NAME
          ? [
              [
                { model: EventUser, as: 'event_users' },
                { model: User, as: 'users' },
                { model: UserCompanyRole, as: 'users_companies_roles' },
                { model: Role, as: 'role' },
                'name',
                order || SortBy.DESC,
              ],
            ]
          : [[sort_column || 'createdAt', order || SortBy.DESC]],
    });
    const { count } = eventCounts;

    return {
      data: events,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getAllEventsUserListing(
    userCompanyEventQueryParams: UserCompanyEventQueryParams,
  ) {
    const { user_id, order, sort_column, page, page_size } =
      userCompanyEventQueryParams;

    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    // Finding company Ids to which user is associated with
    const userCompanies = (
      await UserCompanyRole.findAll({ where: { user_id } })
    ).map((userCompanyRole) => userCompanyRole.company_id);

    // Finding count and event Ids
    const events = await Event.findAndCountAll({
      where: getUserCompanyEventWhere(
        userCompanyEventQueryParams,
        userCompanies,
        user_id,
      ),
      attributes: [
        'id',
        [
          Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = ${user_id} AND "event_id" = "Event"."id"
              )
              )`),
          'assigned',
        ],
      ],
      include: includeUserCompanyEvents(user_id),
      subQuery: false,
      limit: _page_size,
      offset: _page_size * _page,
      order: getOrderOfUserCompanyEvents(sort_column, order),
    });

    // Mapping event Ids for getting data
    const eventIds = events.rows.map((event) => event.id);

    // Finding events with mapped Ids.
    const _events = await Event.findAll({
      where: { id: { [Op.in]: eventIds } },
      attributes: [
        'id',
        'name',
        'venue_name',
        'start_date',
        'company_id',
        'event_category',
        'region_id',
        [
          Sequelize.literal('"company->users_companies_roles->role"."name"'),
          'role_name',
        ],
        [Sequelize.literal('company.name'), 'company_name'],
        [
          Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = ${user_id} AND "event_id" = "Event"."id"
            )
          )`),
          'assigned',
        ],
        eventCadsCount,
        isEventCads,
        isCads,
      ],
      include: includeUserCompanyEvents(user_id),
      subQuery: false,
      order: getOrderOfUserCompanyEvents(sort_column, order),
    });

    const { count } = events;

    return {
      data: _events,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getAllEventNames(eventNameQuery: EventNamesQueryParams, user: User) {
    const { page, page_size, keyword, selected_id, company_id } =
      eventNameQuery;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);
    const order: any = [];

    if (selected_id) {
      order.push([
        Sequelize.literal(
          `CASE WHEN "Event"."id" = ${selected_id} THEN 0 ELSE 1 END`,
        ),
        SortBy.ASC,
      ]);
    }

    order.push(
      Event.orderByStatusSequence,
      [
        Sequelize.literal(
          `CASE WHEN "Event"."status" = 1 THEN "Event"."public_start_date" END`,
        ),
        'DESC',
      ],
      ['public_start_date', SortBy.ASC],
    );

    if (isOntrackRole(user['role'])) {
      const event = await Event.findAndCountAll({
        where: await getEventNameSearch(keyword, user, null, company_id),
        attributes: [
          ...eventNamesAttributes,
          [Event.getStatusNameByKey, 'status'],
        ],
        limit: _page_size,
        offset: _page_size * _page,
        order,
      });

      const { rows, count } = event;

      return {
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      };
    } else {
      const subcompanies = await getSubCompanies(
        user['company_id'],
        user,
        this.companyService,
      );

      // making an array of company and subcompanies ids and passing this array to fetch all events of company and subcompanies in Event Where Function
      let companyAndSubcompaniesIds = [user['company_id']];

      companyAndSubcompaniesIds = [
        ...subcompanies.map(({ id }) => id),
        ...companyAndSubcompaniesIds,
      ];

      if (company_id && !companyAndSubcompaniesIds.includes(company_id))
        throw new UnauthorizedException();

      const event = await Event.findAndCountAll({
        where: {
          ...(await getEventNameSearch(
            keyword,
            user,
            companyAndSubcompaniesIds,
            company_id,
          )),
        },
        attributes: [
          ...eventNamesAttributes,
          [Event.getStatusNameByKey, 'status'],
        ],
        include: !isUpperRoles(Number(user['role']))
          ? [EventUserModel(user.id)]
          : [],
        limit: _page_size,
        offset: _page_size * _page,
        order,
        subQuery: false,
      });

      const { rows, count } = event;

      return {
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      };
    }
  }

  async getEventAttachments(id: number, user: User) {
    // checking if user have correct access
    await withCompanyScope(user, id);

    return this.imageService.getImages(id, PolymorphicType.EVENT);
  }

  async getEventComments(
    id: number,
    getEventCommentDto: GetEventCommentDto,
    user: User,
  ) {
    const { comment_id, page, page_size } = getEventCommentDto;
    // if user has access to this event
    await withCompanyScope(user, id);

    const data = {
      id,
      event_id: id,
      type: CommentableTypes.EVENT,
      page,
      page_size,
      comment_id,
    };

    // all comments against event
    const comments = await this.communicationService.communication(
      data,
      'get-comment-list',
      user,
    );

    return {
      ...comments,
      pagination: {
        total_count: comments.pagination.total_count,
        total_pages: Math.max(comments.pagination.total_pages),
      },
    };
  }

  async getEventChangeLogs(
    id: number,
    paginationDto: PaginationDto,
    user: User,
  ) {
    // if user has access to this event
    const [, , timezone] = await withCompanyScope(user, id);

    // all change logs against event
    const { data, pagination } = await this.changeLogService.getChangeLogs({
      id,
      types: [PolymorphicType.EVENT],
      page: paginationDto.page,
      page_size: paginationDto.page_size,
    });

    const translatedChangelogs =
      await this.translateService.translateChangeLogs(
        user,
        data,
        PolymorphicType.EVENT,
        timezone,
      );

    return {
      data: translatedChangelogs,
      pagination,
    };
  }

  async getEventStatuses() {
    return Object.values(EventStatusAPI);
  }

  async getEventGenre() {
    return Object.values(EventGenre);
  }

  async getAllVenues(company_id: number, user: User) {
    let venues = [];
    let where = {};
    let include = [];

    if (!(isOntrackRole(user['role']) && !company_id)) {
      const companyAndSubcompaniesIds = await getCompanyIdsWithCheckPermission(
        user,
        company_id,
        this.companyService,
      );

      where = { company_id: { [Op.in]: companyAndSubcompaniesIds } };
      include = !isUpperRoles(Number(user['role']))
        ? [EventUserModel(user.id)]
        : [];
    }

    venues = await Event.findAll({
      where,
      attributes: ['id', 'venue_name'],
      include,
      order: [['venue_name', SortBy.ASC]],
      raw: true,
    });

    return venues
      .map(({ venue_name }) => venue_name)
      .filter(
        (value, index, self) => self.indexOf(value) === index && value !== null,
      );
  }

  async getAllEventCountries(company_id: number, user: User) {
    let events = [];
    let where = {};
    let include = [];

    if (!(isOntrackRole(user['role']) && !company_id)) {
      const companyAndSubcompaniesIds = await getCompanyIdsWithCheckPermission(
        user,
        company_id,
        this.companyService,
      );

      where = { company_id: { [Op.in]: companyAndSubcompaniesIds } };
      include = !isUpperRoles(Number(user['role']))
        ? [EventUserModel(user.id)]
        : [];
    }

    events = await Event.findAll({
      where,
      attributes: [
        [
          Sequelize.literal(
            `TRIM(SUBSTRING(SUBSTRING("event_location" FROM '[^,]*$') FROM '[^-]*$'))`,
          ),
          'country',
        ],
      ],
      include,
      group: ['country'],
      order: [['country', SortBy.ASC]],
      raw: true,
    });

    return events
      .map((event) => event.country)
      .filter(
        (country) =>
          !!country && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(country),
      );
  }

  async getAllUnreadsCount(event_id: number) {
    const incidentsUnreadCount = await Incident.count({
      where: { event_id, unread: true },
    });

    const lostAndFoundsUnreadCount = await LostAndFound.count({
      where: { event_id, unread: true },
    });

    const messagesUnreadCount = await Message.count({
      where: {
        event_id,
        message_type: 'received',
        unread: true,
        messageable_type: { [Op.ne]: PolymorphicType.INCIDENT_MESSAGE_CENTER },
      },
    });

    const notificationsUnreadCount = await Notification.count({
      where: {
        event_id,
        unread: true,
      },
    });

    const serviceRequestsUnreadCount = await ServiceRequest.count({
      where: {
        event_id,
        unread: true,
      },
    });

    return {
      incidentsUnreadCount,
      lostAndFoundsUnreadCount,
      messagesUnreadCount,
      notificationsUnreadCount,
      serviceRequestsUnreadCount,
    };
  }

  async getAllEventNamesOnly(
    dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    user: User,
  ) {
    const { page, page_size, selected_id, without_pagination } =
      dashboardDropdownsQueryDto;

    const [_page, _page_size] = without_pagination
      ? getPageAndPageSize(page, page_size)
      : getPageAndPageSizeWithDefault(page, page_size);

    const order: any = [];

    if (selected_id) {
      order.push([
        Sequelize.literal(`CASE WHEN id = ${selected_id} THEN 0 ELSE 1 END`),
        SortBy.ASC,
      ]);
    }

    order.push(['name', SortBy.ASC]);

    const { companyIds } = await getScopeAndCompanyIds(user);

    if (!companyIds.length && notUserHaveOntrackRole(user))
      throw new UnauthorizedException();

    const events = await Event.findAndCountAll({
      where: {
        ...(await eventNamesWhere(
          dashboardDropdownsQueryDto,
          user,
          companyIds,
        )),
      },
      attributes: ['id', 'name', [Event.getStatusNameByKey, 'status']],
      order,
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = events;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getAllRequestedEvents(
    filters: EventRequestStatusParams,
    user: User,
    res: Response,
    req: Request,
  ) {
    let festivalsCount = 0;
    let venuesCount = 0;

    const { page, page_size, csv } = filters;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    // Created a helper function here for reuse the code of finding events, their count, etc.
    const { events, companyAndSubcompaniesIds } = await getAllEventsHelper(
      filters,
      user,
      _page,
      _page_size,
      this.companyService,
      true,
      csv,
      true,
    );

    // csv work
    if (csv) {
      return await getCsvForAllEventsListing(
        events,
        req,
        res,
        this.httpService,
      );
    }

    // Getting total request events counts
    const totalRequestedEventCounts = await Event.findAll({
      where: await getEventsWhereQuery(
        { ...filters, event_category: null },
        companyAndSubcompaniesIds,
        true,
        user,
        null,
      ),
      attributes: ['id', 'event_category'],
      include: getAllEventsForStatusesInclude(
        user,
        isUpperRoles(Number(user['role'])),
      ),
    });

    for (const requestEvent of totalRequestedEventCounts) {
      if (requestEvent.event_category === REQUEST_EVENT_TYPE.VENUES)
        venuesCount++;
      else if (requestEvent.event_category === REQUEST_EVENT_TYPE.FESTIVALS)
        festivalsCount++;
    }

    return res.send(
      successInterceptorResponseFormat({
        data: events,
        pagination: calculatePagination(
          totalRequestedEventCounts.length,
          _page_size || parseInt(this.configService.get('PAGE_LIMIT')),
          _page || parseInt(this.configService.get('PAGE')),
        ),
        totalCompanies: companyAndSubcompaniesIds.length,
        counts: {
          festivalsCount,
          venuesCount,
        },
      }),
    );
  }

  async getModuleCountByEventId(
    getModuleCountForAnEvent: GetModuleCountForAnEvent,
    eventId: number,
    user: User,
  ) {
    const { module } = getModuleCountForAnEvent;

    await withCompanyScope(user, eventId);

    return await getSpecificModuleCounts(eventId, module, user);
  }

  async getEventForCadPreview(id: number, user: User) {
    // checking if user have correct access
    await withCompanyScope(user, id, { useMaster: true });

    const event = await Event.findByPk(id, {
      attributes: [
        'id',
        'location',
        'name',
        'company_id',
        'location',
        'short_event_location',
        'event_category',
        'time_zone',
        isEventCads,
        isCads,
        [Sequelize.literal('"company"."name"'), 'company_name'],
      ],
      include: getEventCadPreviewInclude(
        user,
        isUpperRoles(Number(user['role'])),
      ),
      subQuery: false,
    });
    if (!event) throw new NotFoundException(RESPONSES.notFound('Event'));

    return event;
  }

  async getEventById(
    id: number,
    user: User,
    req?: Request,
    params?: GetEventByIdDto,
    options?: Options,
  ) {
    // checking if user have correct access
    await withCompanyScope(user, id, { useMaster: true });

    const event = await getEventByIdHelper(id, user, options);

    if (params?.pdf) {
      const response = await getPdfForSpecificEvent(
        event,
        this.httpService,
        params,
        req,
      );
      return response.data;
    }

    return event;
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto, user: User) {
    const { event_cads, event_location, status } = updateEventDto;

    const event = await Event.findOne({
      where: { id },
      attributes: ['id', 'company_id', 'event_location'],
    });

    // checking if logged user have correct access
    await withCompanyScope(user, id);

    if (event_location && event_location !== event.event_location) {
      updateEventDto['short_event_location'] = await updateEventLocation(
        event_location,
        this.geocoder,
      );
    }

    const _status = EventStatus[status?.toUpperCase()];

    if (_status === EventStatus.UPCOMING || _status === EventStatus.ON_HOLD) {
      updateEventDto['status'] = _status;
      updateEventDto['request_status'] =
        _status === EventStatus.UPCOMING ? 'approved' : 'denied';
    }

    const transaction = await this.sequelize.transaction();

    try {
      await Event.update(updateEventDto, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & { editor: Editor });

      // Create Cad
      await this.eventCadService.bulkCreateEventCad(
        event_cads,
        id,
        user,
        transaction,
        { useMaster: true },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    const _event = await this.getEventById(id, user, null, null, {
      useMaster: true,
    });

    // This is for sending updated event in sockets so changes in event can be visible by everyone on frontend real-time
    this.pusherService.sendUpdatedEvent(_event as Event);

    // This is for automation of event statuses based on start or end date
    this.queuesService.scheduleEventStatus(_event, user);

    // This is for sending update to dashboard/analytics service
    this.analyticCommunicationService.analyticCommunication(
      { eventId: _event.id, isNewEvent: false },
      'event',
      user,
    );

    return _event;
  }

  async updateEventStatus(
    id: number,
    updateEventStatusDto: UpdateEventStatusDto,
    user: User,
  ) {
    // checking if user have correct access
    await withCompanyScope(user, id);

    const event = await Event.findOne({
      where: { id },
      attributes: ['id', 'status', 'company_id', 'request_status'],
      raw: true,
    });

    // fetching old status for saving as changelog
    const oldRequestedStatus = event.request_status;
    const oldStatus = event.status;

    if (
      event.request_status === REQUEST_STATUS.REQUESTED ||
      event.request_status === 'denied'
    ) {
      EventStatus[updateEventStatusDto.status.toUpperCase()] ===
      EventStatus.UPCOMING
        ? (event['request_status'] = 'approved')
        : EventStatus[updateEventStatusDto.status.toUpperCase()] ===
            EventStatus.ON_HOLD
          ? (event['request_status'] = 'denied')
          : (event['request_status'] = null);
    }

    event['status'] = EventStatus[updateEventStatusDto.status.toUpperCase()];

    const transaction = await this.sequelize.transaction();

    try {
      await Event.update(event, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ EventService ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedEvent = await this.getEventById(id, user, null, null, {
      useMaster: true,
    });
    const _updatedEvent = updatedEvent.get({ plain: true });

    // This is for automation of event statuses based on start or end date
    this.queuesService.scheduleEventStatus(updatedEvent, user);

    if (_updatedEvent.request_status === 'denied') {
      sendDeniedRequestEvent(
        _updatedEvent,
        'status-update',
        'request-denied',
        false,
        this.pusherService,
      );
    } else {
      this.pusherService.sendUpdatedEvent(updatedEvent as Event);
    }

    const requestedEventCount = await getRequestedEventCount({
      useMaster: true,
    });

    this.pusherService.requestedEventCount(requestedEventCount);

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        { eventId: id, isNewEvent: false },
        'event',
        user,
      );
    } catch (err) {
      console.log('🚀 ~ Analytics Communcation ~ err:', err);
    }

    const isStatusChangedToCompleted =
      oldStatus !== EventStatus.COMPLETED &&
      event['status'] === EventStatus.COMPLETED;

    if (isStatusChangedToCompleted) {
      try {
        await this.reportingCommunicationService.communication(
          { eventId: event.id, isCompelete: isStatusChangedToCompleted },
          'event-compelete',
          user,
        );
      } catch (err) {
        console.log(
          '🚀 ~ EventService ~ reportingCommunicationService  err:',
          err,
        );
      }
    }

    await sendEmailOnRequestStatusChange(
      oldRequestedStatus,
      _updatedEvent,
      this.communicationService,
    );

    return _updatedEvent;
  }

  async pinEvent(id: number, user: User) {
    // checking if user have right acces
    await withCompanyScope(user, id);

    // fetching event is pinned or not
    const pinnedEvent = await this.userPinsService.findUserPin(
      id,
      user.id,
      PolymorphicType.EVENT,
    );

    if (!pinnedEvent) {
      // if not pin event exist creating new entery for pinning a event
      await this.userPinsService.createUserPin(
        id,
        user.id,
        PolymorphicType.EVENT,
      );
    } else {
      // if pin event exist destroying old record from db
      await this.userPinsService.deleteUserPin(
        id,
        user.id,
        PolymorphicType.EVENT,
      );
    }

    return { success: true };
  }

  async demoEvent(id: number, user: User) {
    // checking if user have right acces
    await withCompanyScope(user, id);

    const event = await Event.findByPk(id, {
      attributes: [
        'id',
        'name',
        'demo_event',
        'event_location',
        'short_event_location',
        'event_category',
        'created_at',
        'venue_name',
        'status',
        'request_status',
        [Sequelize.literal('"user"."name"'), 'requestee_name'],
        [Sequelize.literal('"user"."cell"'), 'requestee_cell'],
        [Sequelize.literal('"user"."email"'), 'requestee_email'],
        [Sequelize.literal('"user"."country_code"'), 'requestee_country_code'],
      ],
      include: [{ model: User, as: 'user', attributes: [] }],
    });

    const transaction = await this.sequelize.transaction();

    try {
      await Event.update({ demo_event: !event.demo_event }, {
        where: { id },
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
        transaction,
      } as UpdateOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.sendUpdatedEvent(event as Event);

    const requestedEventCount = await getRequestedEventCount();

    this.pusherService.requestedEventCount(requestedEventCount);

    return { success: true };
  }

  async updateRestrictAccess(id: number, user: User) {
    // checking if user have right acces
    await withCompanyScope(user, id);

    const event = await Event.findByPk(id, {
      attributes: ['id', 'name', 'event_access_lock'],
    });

    const transaction = await this.sequelize.transaction();

    try {
      await Event.update({ event_access_lock: !event.event_access_lock }, {
        where: { id },
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
        transaction,
      } as UpdateOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // updated event data
    const updatedEvent = await this.getEventById(id, user, null, null, {
      useMaster: true,
    });

    this.pusherService.sendUpdatedEvent(updatedEvent as Event);

    return { success: true };
  }

  async updateDivisionLock(id: number, user: User) {
    // checking if user have right acces
    await withCompanyScope(user, id);

    const event = await Event.findByPk(id, {
      attributes: ['id', 'name', 'division_lock_service'],
    });

    const transaction = await this.sequelize.transaction();

    try {
      await Event.update(
        { division_lock_service: !event.division_lock_service },
        {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & { editor: Editor },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // updated event data
    const updatedEvent = await this.getEventById(id, user, null, null, {
      useMaster: true,
    });

    try {
      this.pusherService.sendUpdatedEvent(updatedEvent as Event);
    } catch (e) {}

    return { success: true };
  }

  async deleteEventAttachment(id: number, attachmentId: number, user: User) {
    let deletedImage: Image;

    // if user has access to this event
    await withCompanyScope(user, id);

    const event = await Event.findOne({
      where: { id },
      include: [
        {
          model: Image,
          as: 'eventAttachments',
          where: { id: attachmentId },
        },
      ],
    });
    if (!event)
      throw new NotFoundException('Attachment not found against this event!');

    const transaction = await this.sequelize.transaction();

    try {
      // delete attachment
      deletedImage = await this.imageService.deleteImage(
        attachmentId,
        user,
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    deletedImage['isDeleted'] = true;

    this.pusherService.sendUpdatedAttachment(
      deletedImage,
      PolymorphicType.EVENT,
      id,
    );

    return { success: true };
  }

  async deleteEvent(id: number) {
    // checking is event exist
    await isEventExist(id);

    const transaction = await this.sequelize.transaction();

    try {
      await Event.destroy({
        where: { id },
        transaction,
      });

      // trigger @AfterDestroy hook manually
      await destroyAssociatedData(id, transaction);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.deleteEvent(id);

    const requestedEventCount = await getRequestedEventCount({
      useMaster: true,
    });

    this.pusherService.requestedEventCount(requestedEventCount);

    return { success: true };
  }

  // using this function in Company while fetch all events of sub companies
  async findAllEventsOfsubcompany(params: SubcompaniesWithEvents, user: User) {
    const { page, page_size, order, sort_column, company_id } = params;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const events = await Event.findAndCountAll({
      where: await getEventsOfSubcompanyWhereQuery(params, user),
      attributes: [
        'id',
        'name',
        'logo',
        'active',
        'createdAt',
        [
          Sequelize.literal(
            `(SELECT COUNT("events"."id") FROM events where ${company_id}="events"."company_id" AND "events"."deleted_at" IS NULL)`,
          ),
          'totalCount',
        ],
        [
          Sequelize.literal(
            `(SELECT country FROM companies WHERE "companies"."id"="Event"."company_id")`,
          ),
          'country',
        ],
      ],
      limit: _page_size,
      offset: _page_size * _page,
      order: [[sort_column || 'name', order || SortBy.ASC]],
    });

    const { rows, count } = events;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }
}
