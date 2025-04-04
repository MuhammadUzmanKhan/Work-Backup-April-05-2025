import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { Op, Order, Sequelize, Transaction } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import axios from 'axios';
import NodeGeocoder from 'node-geocoder';
import { ConfigService } from '@nestjs/config';
import { uid } from 'uid';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Company,
  Event,
  EventDepartment,
  EventIncidentDivision,
  EventIncidentType,
  EventInventory,
  EventSource,
  EventUser,
  Image,
  Incident,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  MessageSetting,
  Role,
  Source,
  Task,
  TaskList,
  User,
  UserCompanyRole,
  UserIncidentDivision,
  UserPins,
} from '@ontrack-tech-group/common/models';
import {
  addTasksAndAttachments,
  getFormattedEventDataForCsv,
  getFormattedEventForPdf,
  isCompanyExist,
  isUpperRoles,
  parseCSV,
  throwCatchError,
} from '@ontrack-tech-group/common/helpers';
import {
  AssociatedDataType,
  CsvOrPdf,
  ERRORS,
  EventStatus,
  MESSAGE_SETTING_TYPE,
  NotificationModule,
  NotificationType,
  Options,
  PdfTypes,
  Priority,
  PusherChannels,
  PusherEvents,
  RESPONSES,
  RolesNumberEnum,
  SortBy,
  TemplateNames,
  isLowerRoleIncludingOperationManager,
  isWithRestrictedVisibility,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  PusherService,
  checkUserNotificationSettingEmailPermission,
  createNotification,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { CompanyService } from '@Modules/company/company.service';
import {
  EventModuleFuture,
  UserCompanyEventSortingColumn,
  _ERRORS,
  EventUploadCsv,
  REQUEST_STATUS,
} from '@Common/constants';
import { checkPermissions, formatDate } from '@Common/helpers';
import { QueuesService } from '@Modules/queues/queues.service';
import {
  EventQueryParams,
  GetEventByIdDto,
  GetEventCardViewCsvParams,
  EventRequestStatusParams,
  UploadEventDto,
  EventUploadCSVDto,
} from '../dto';
import {
  isEventCads,
  isCads,
  moduleCounts,
  isPinnedIncidentTypes,
  divisionlockWithRestrictedVisibilityLiteral,
  divisionRawIncludeLiteral,
  eventCadsCount,
  pinnedIncidentTypesCount,
} from './query';
import { headerMapping } from '../constants';
import {
  companiesCountWhere,
  getEventsWhereQuery,
  getTaskCountForSpecificUserWhere,
  pinnedIncidentTypeWhere,
} from './where';
import {
  getAllEventIdsInclude,
  getAllEventsCountInclude,
  getAllEventsForStatusesInclude,
  getAllEventsForStatusesIncludeV1,
  getAllEventsInclude,
  getAllEventsIncludeV1,
  getEventByIdInclude,
} from './include';
import { eventActiveModulesAttributes, eventAttributes } from './attributes';
import { eventListingOrder } from './orders';

export * from './attributes';
export * from './include';
export * from './where';
export * from './query';

export const getAllEventsHelper = async (
  filters:
    | EventQueryParams
    | GetEventCardViewCsvParams
    | EventRequestStatusParams,
  user: User,
  page: number,
  page_size: number,
  companies: CompanyService,
  getTotalEvents = false,
  csv?: string,
  requestedEvent?: boolean,
) => {
  let companyAndSubcompaniesIds = [];
  let _subCompanies = [];

  if (
    (user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER) ||
    filters.company_id
  ) {
    const [isCompanyOneOfSubcompany, subCompanies] = await checkPermissions(
      filters.company_id,
      user,
      companies,
    );

    _subCompanies = subCompanies.map(({ id }) => id);

    // making an array of company and subcompanies ids and passing this array to fetch all events of company and subcompanies in Event Where Function
    companyAndSubcompaniesIds = [filters.company_id];

    if (!isCompanyOneOfSubcompany) {
      companyAndSubcompaniesIds = [
        ...subCompanies.map(({ id }) => id),
        ...companyAndSubcompaniesIds,
      ];
    }
  }

  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
    !filters.company_id
  ) {
    throw new BadRequestException(ERRORS.COMPANY_ID_IS_REQUIRED);
  }

  // fetching all events with thier subtasks
  const events = await Event.findAll({
    where: await getEventsWhereQuery(
      filters,
      companyAndSubcompaniesIds,
      requestedEvent,
      user,
    ),
    attributes: [
      'id',
      'name',
      'time_zone',
      'event_location',
      'short_event_location',
      'region_id',
      'company_id',
      'key_genre',
      'genre',
      'sub_genre',
      'start_time',
      'end_time',
      'start_date',
      'end_date',
      'public_start_time',
      'public_end_time',
      'public_start_date',
      'public_end_date',
      'venue_name',
      'created_at',
      'demo_event',
      'request_status',
      'event_category',
      'cloned',
      'import',
      'event_access_lock',
      'venue_id',
      'location',
      'created_at',
      [Event.getStatusNameByKey, 'status'],
      [Event.getTypeNameByKey, 'event_type'],
      [Sequelize.literal('company.name'), 'company_name'],
      [
        Sequelize.literal(`(
          SELECT COUNT ( "event_subtasks"."id" ) :: INTEGER FROM event_subtasks
          WHERE "Event"."id" = "event_subtasks"."event_id"
        )`),
        'totalSubtasks',
      ],
      [Sequelize.literal('"user"."name"'), 'requestee_name'],
      [Sequelize.literal('"user"."cell"'), 'requestee_cell'],
      [Sequelize.literal('"user"."email"'), 'requestee_email'],
      [Sequelize.literal('"user"."country_code"'), 'requestee_country_code'],
      [
        Sequelize.literal(`(
          SELECT COUNT ( "incidents"."id" )::INTEGER FROM "incidents"
          WHERE "Event"."id" = "incidents"."event_id"
          AND "incidents"."priority" = ${Priority.CRITICAL}
        )`),
        'criticalIncidents',
      ],
      moduleCounts(user),
      eventCadsCount,
      isEventCads,
      isCads,
      isPinnedIncidentTypes,
      pinnedIncidentTypesCount,
      ...eventActiveModulesAttributes,
    ],
    include: getAllEventsInclude(user, isUpperRoles(Number(user['role']))),
    limit: page_size || csv ? page_size : parseInt(process.env.PAGE_LIMIT),
    offset:
      page * page_size || csv
        ? page * page_size || undefined
        : parseInt(process.env.PAGE),
    subQuery: false,
    order: [
      [{ model: UserPins, as: 'user_pin_events' }, 'id', SortBy.ASC],
      Event.orderByStatusSequence,
      [
        Sequelize.literal(
          `CASE WHEN "Event"."status" = 1 THEN "Event"."public_start_date" END`,
        ),
        'DESC',
      ], //sort completed status events desc order based on public_start_Date
      [filters.sort_column || 'public_start_date', filters.order || SortBy.ASC],
    ],
    benchmark: true,
  });

  // counting events with filters and searchable fields
  let totalEvents: Event[];
  if (getTotalEvents) {
    totalEvents = await Event.findAll({
      where: await getEventsWhereQuery(
        filters,
        companyAndSubcompaniesIds,
        requestedEvent,
        user,
      ),
      attributes: ['id'],
      include: getAllEventsCountInclude(
        user,
        isUpperRoles(Number(user['role'])),
      ),
      benchmark: true,
    });
  }

  const statusCount = await Event.findAll({
    where: await getEventsWhereQuery(
      filters,
      companyAndSubcompaniesIds,
      requestedEvent,
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
    benchmark: true,
  });

  return {
    events,
    totalEvents,
    companyAndSubcompaniesIds,
    statusCount,
    _subCompanies,
  };
};

export const getAllEventsHelperV1 = async (
  filters:
    | EventQueryParams
    | GetEventCardViewCsvParams
    | EventRequestStatusParams,
  user: User,
  page: number,
  page_size: number,
  companies: CompanyService,
  csv?: string,
  requestedEvent?: boolean,
) => {
  let companyAndSubcompaniesIds = [];
  let _subCompanies = [];

  if (
    (user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER) ||
    filters.company_id
  ) {
    const [isCompanyOneOfSubcompany, subCompanies] = await checkPermissions(
      filters.company_id,
      user,
      companies,
    );

    _subCompanies = subCompanies.map(({ id }) => id);

    // making an array of company and subcompanies ids and passing this array to fetch all events of company and subcompanies in Event Where Function
    companyAndSubcompaniesIds = [filters.company_id];

    if (!isCompanyOneOfSubcompany) {
      companyAndSubcompaniesIds = [
        ...subCompanies.map(({ id }) => id),
        ...companyAndSubcompaniesIds,
      ];
    }
  }

  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
    !filters.company_id
  ) {
    throw new BadRequestException(ERRORS.COMPANY_ID_IS_REQUIRED);
  }

  const eventIds = (
    await Event.findAll({
      where: await getEventsWhereQuery(
        filters,
        companyAndSubcompaniesIds,
        requestedEvent,
        user,
      ),
      attributes: [
        'id',
        [
          Sequelize.literal(`(
          SELECT COUNT ( "event_subtasks"."id" ) :: INTEGER FROM event_subtasks
          WHERE "Event"."id" = "event_subtasks"."event_id"
        )`),
          'totalSubtasks',
        ],
      ],
      include: getAllEventIdsInclude(user, isUpperRoles(Number(user['role']))),
      order: eventListingOrder(filters.sort_column, filters.order),
      benchmark: true,
      raw: true,
    })
  ).map(({ id }) => id);

  const limit = page_size;
  const offset = page * page_size;

  // Determine if slicing is needed
  const paginatedEventIds =
    limit !== undefined && offset !== undefined
      ? eventIds.slice(offset, offset + limit)
      : eventIds;

  // fetching all events with thier subtasks
  const events = await Event.findAll({
    where: { id: { [Op.in]: paginatedEventIds } },
    attributes: [
      'id',
      'name',
      'time_zone',
      'event_location',
      'short_event_location',
      'region_id',
      'company_id',
      'key_genre',
      'genre',
      'sub_genre',
      'start_time',
      'end_time',
      'start_date',
      'end_date',
      'public_start_time',
      'public_end_time',
      'public_start_date',
      'public_end_date',
      'venue_name',
      'created_at',
      'demo_event',
      'request_status',
      'event_category',
      'cloned',
      'import',
      'event_access_lock',
      'venue_id',
      'location',
      [Event.getStatusNameByKey, 'status'],
      [Event.getTypeNameByKey, 'event_type'],
      [Sequelize.literal('company.name'), 'company_name'],
      [
        Sequelize.literal(`(
          SELECT COUNT ( "event_subtasks"."id" ) :: INTEGER FROM event_subtasks
          WHERE "Event"."id" = "event_subtasks"."event_id"
        )`),
        'totalSubtasks',
      ],
      [Sequelize.literal('"user"."name"'), 'requestee_name'],
      [Sequelize.literal('"user"."cell"'), 'requestee_cell'],
      [Sequelize.literal('"user"."email"'), 'requestee_email'],
      [Sequelize.literal('"user"."country_code"'), 'requestee_country_code'],
      [
        Sequelize.literal(`(
          SELECT COUNT ( "incidents"."id" )::INTEGER FROM "incidents"
          WHERE "Event"."id" = "incidents"."event_id"
          AND "incidents"."priority" = ${Priority.CRITICAL}
        )`),
        'criticalIncidents',
      ],
      moduleCounts(user),
      eventCadsCount,
      isEventCads,
      isCads,
      isPinnedIncidentTypes,
      pinnedIncidentTypesCount,
      ...eventActiveModulesAttributes,
    ],
    include: getAllEventsIncludeV1(user, isUpperRoles(Number(user['role']))),
    subQuery: false,
    order: eventListingOrder(filters.sort_column, filters.order),
    benchmark: true,
  });

  const statusCount = await Event.findAll({
    where: await getEventsWhereQuery(
      filters,
      companyAndSubcompaniesIds,
      requestedEvent,
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
    include: getAllEventsForStatusesIncludeV1(
      user,
      isUpperRoles(Number(user['role'])),
    ),
    group: [`"company"."id"`, `"Event"."status"`],
    raw: true,
    benchmark: true,
  });

  return {
    events,
    totalEvents: eventIds.length,
    companyAndSubcompaniesIds,
    statusCount,
    _subCompanies,
  };
};

export const destroyAssociatedData = async (
  event_id: number,
  transaction?: Transaction,
) => {
  // This try catch should not be deleted.
  try {
    await Image.destroy({
      where: {
        imageable_id: event_id,
        imageable_type: 'Event',
      },
      transaction,
    });

    await EventUser.destroy({
      where: {
        event_id,
      },
      transaction,
    });

    await EventDepartment.destroy({
      where: { event_id },
      transaction,
    });

    await EventInventory.destroy({
      where: { event_id },
      transaction,
    });
  } catch (er) {
    console.log('🚀 ~ destroyAssociatedData ~ er:', er);
  }
};

export const getPdfForSpecificEvent = async (
  event: Event,
  httpService: HttpService,
  params?: GetEventByIdDto,
  req?: Request,
) => {
  // Mapping timezone in name and utc offset format
  if (event.time_zone && event.time_zone !== '') {
    event.time_zone = `${event.time_zone} (UTC ${moment
      .tz(event.time_zone)
      .format('Z')})`;
  }

  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    getFormattedEventForPdf(event),
    CsvOrPdf.PDF,
    PdfTypes.EVENT_DETAIL,
    params.file_name,
  );
  return response;
};

export const getCsvForAllEventsListing = async (
  events: Event[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  // Formatting data for csv
  const formattedEventForCsv = getFormattedEventDataForCsv(
    events.map((event) => event.get({ plain: true })),
  );

  // Api call to lambda for getting csv
  // TODO: define type for response instead of any.
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedEventForCsv,
    CsvOrPdf.CSV,
  );

  // Setting Headers for csv and sending csv in response
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="events.csv"');
  return res.send(response.data);
};

export const createMessageSettingType = async (
  event_id: number,
  transaction?: Transaction,
) => {
  const messageSettings = [];
  for (const message_type of MESSAGE_SETTING_TYPE) {
    messageSettings.push({
      event_id,
      message_type,
    });
  }

  await MessageSetting.bulkCreate(messageSettings, { transaction });
};

export const copyOperationalDateTime = async (
  copy_operational_date_time: boolean,
  event: Event,
  transaction?: Transaction,
) => {
  if (!event) return;

  const { id, start_date, end_date, start_time, end_time } = event;

  if (copy_operational_date_time) {
    await Event.update(
      {
        public_start_date: start_date,
        public_end_date: end_date,
        public_start_time: start_time,
        public_end_time: end_time,
      },
      { where: { id }, transaction },
    );
  }
};

export const createInitialAssociatedData = async (
  event: Event,
  transaction?: Transaction,
) => {
  const associatedData: AssociatedDataType[] = [
    [Source, 'Source', EventSource, 'source_id'],
    [
      IncidentDivision,
      'Division',
      EventIncidentDivision,
      'incident_division_id',
    ],
    [IncidentType, 'Incident', EventIncidentType, 'incident_type_id'],
  ];

  for (const data of associatedData) {
    await associateData(data, event, transaction);
  }

  await associateIncidentZone(event, transaction);
};

export const associateData = async (
  data: AssociatedDataType,
  event: Event,
  transaction?: Transaction,
) => {
  // This try catch should not be deleted.
  try {
    let _data = null;

    if (data[0] === IncidentType)
      _data = await createDefaultIncidentTypes(data, event, transaction);
    else
      _data = await data[0].findOrCreate({
        where: { company_id: event.company_id, is_test: true },
        defaults: {
          name: `[Test ${data[1]}]`,
        },
        transaction,
        raw: true,
      });

    await data[2].create(
      {
        event_id: event.id,
        [data[3]]: _data[0].id,
      },
      { transaction },
    );
  } catch (err) {
    console.log(
      '🚀 ~ file: event.service.ts:1083 ~ EventService ~ associateData ~ err:',
      err,
    );
  }
};

export const associateIncidentZone = async (
  event: Event,
  transaction?: Transaction,
) => {
  const loc = event.location.center;
  const zones = await IncidentZone.findAll({
    where: {
      event_id: event.id,
      is_test: true,
    },
  });

  if (zones.length) {
    await zones[zones.length - 1].update(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      { transaction },
    );
  } else {
    const incidentZone = {
      name: '[Test - Zone]',
      event_id: event.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      sequence: 0,
      color: '#a7a1a1',
      is_test: true,
    };

    await IncidentZone.create(incidentZone, { transaction });
  }
};

export const getSubCompanies = async (
  companyId: number,
  user: User,
  companyService: CompanyService,
) => {
  // We need to find subcompanies only for global or super admin. As other users can have only access to their own company.
  let subCompanies = [];

  if (
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
  )
    subCompanies = await companyService.findAllSubcompaniesByCompanyId(
      companyId,
      user,
    );

  return subCompanies;
};

export const getRequestedEventCount = async (options?: Options) => {
  return await Event.count({
    where: { request_status: { [Op.in]: ['requested', 'denied'] } },
    ...options,
  });
};

export const getOrderOfUserCompanyEvents = (
  sort_column: UserCompanyEventSortingColumn,
  order: SortBy,
) => {
  const _order: Order =
    sort_column === UserCompanyEventSortingColumn.ROLE_NAME
      ? [
          [
            { model: Company, as: 'company' },
            { model: UserCompanyRole, as: 'users_companies_roles' },
            { model: Role, as: 'role' },
            'name',
            order || SortBy.DESC,
          ],
        ]
      : sort_column === UserCompanyEventSortingColumn.COMPANY_NAME
        ? [[{ model: Company, as: 'company' }, 'name', order || SortBy.DESC]]
        : [[sort_column || Sequelize.col('assigned'), order || SortBy.DESC]];

  return _order;
};

export const getSpecificModuleCounts = async (
  event_id: number,
  module: EventModuleFuture,
  user: User,
) => {
  let count = 0;

  switch (module) {
    case EventModuleFuture.TASK_FUTURE:
      count = await getTaskCountForSpecificUser(event_id, user);
      break;

    case EventModuleFuture.INCIDENT_FUTURE:
      count = await getIncidentCountForSpecificUser(user, event_id);
      break;

    default:
      break;
  }

  return count;
};

export const getTaskCountForSpecificUser = async (
  event_id: number,
  user: User,
) => {
  return await Task.count({
    where: getTaskCountForSpecificUserWhere(event_id, user),
    include: [
      {
        model: TaskList,
        attributes: [],
        required: false,
      },
      {
        model: IncidentDivision,
        attributes: [],
        required: false,
        include: [
          {
            model: UserIncidentDivision,
            attributes: [],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        attributes: [],
        through: { attributes: [] },
      },
      {
        model: Task,
        as: 'subtasks',
        attributes: [],
        include: [
          {
            model: User,
            as: 'users',
            attributes: [],
            through: { attributes: [] },
          },
        ],
      },
    ],
    distinct: true,
  });
};

export const getIncidentCountForSpecificUser = async (
  user: User,
  event_id: number,
) => {
  const _where =
    user && isLowerRoleIncludingOperationManager(+user['role'])
      ? isWithRestrictedVisibility(+user['role'])
        ? divisionlockWithRestrictedVisibilityLiteral(user.id)
        : divisionRawIncludeLiteral(user.id)
      : {};

  return await Incident.count({
    where: { ..._where, event_id },
    attributes: [],
    include: [
      {
        model: Event,
        attributes: [],
      },
      {
        model: IncidentDivision,
        as: 'incident_divisions',
        through: { attributes: [] },
        attributes: [],
        include: [
          {
            model: UserIncidentDivision,
            attributes: [],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        through: { attributes: [] },
        attributes: [],
      },
    ],
    distinct: true,
  });
};

export const parseCsvAndSaveEvents = async (
  uploadEventDto: UploadEventDto,
  httpService: HttpService,
  geocoder: NodeGeocoder,
  user: User,
  queuesService: QueuesService,
) => {
  const { company_id, file } = uploadEventDto;
  let parsedFileData = [];
  const eventErrors = [];
  let createdCount = 0;

  try {
    parsedFileData = await parseCSV(file, httpService);

    if (!parsedFileData.length) return [];
  } catch (error) {
    console.log('🚀 ~ error:', error);
  }

  const csvRecords = updateEventCsvHeaderNames(parsedFileData);
  for (const row of csvRecords) {
    const data = await saveEvent(
      row,
      company_id,
      geocoder,
      user,
      queuesService,
    );

    eventErrors.push(...data?.eventErrors);

    if (data?.createdEvent) {
      createdCount = createdCount + 1;
    }
  }

  return { eventErrors, createdCount };
};

export const updateEventCsvHeaderNames = (rows) => {
  return rows.map((obj) =>
    Object.entries(obj).reduce((acc, [key, value]) => {
      const updatedKey = headerMapping[key.trim()] || key.trim();
      return { ...acc, [updatedKey]: value };
    }, {}),
  );
};

export const saveEvent = async (
  body,
  company_id: number,
  geocoder: NodeGeocoder,
  user: User,
  queuesService: QueuesService,
) => {
  let eventErrors = [];
  let createdEvent = false;
  try {
    bodyValidation(body);

    eventErrors = await validationsForCsv(body, company_id);
    if (eventErrors.length) return { eventErrors };

    body['status'] = EventStatus.UPCOMING;

    const { coordinates, event_location } = await getCoordinates(
      body['event_location'],
    );

    const lat = coordinates?.center?.latitude;
    const long = coordinates?.center?.longitude;

    if (coordinates) {
      // Creation of event
      const event = await Event.create({
        ...body,
        event_type: 0, //0 is event while creating event
        start_time: '00:00:00',
        end_time: '23:59:00',
        public_start_time: '00:00:00',
        public_end_time: '23:59:00',
        location: coordinates,
        event_location,
        short_event_location: event_location
          ? await updateEventLocation(event_location, geocoder)
          : null,
        time_zone: await getTimeZone(lat, long),
      });

      const createdEvent = await getEventByIdHelper(event.id, user);

      // This is for automation of event statuses based on start or end date
      queuesService.scheduleEventStatus(createdEvent, user);
    }

    createdEvent = true;
  } catch (error) {
    console.log('🚀 ~ error:', error);
    eventErrors.push({
      error: error?.errors?.[0].message,
    });
  }

  return { eventErrors, createdEvent };
};

export const validationsForCsv = async (body, company_id: number) => {
  const eventErrors = [];

  body.company_id = company_id;

  const createEventDto = plainToClass(EventUploadCSVDto, body);

  validate(createEventDto).then((errors) => {
    if (errors.length > 0) {
      eventErrors.push({
        error: errors,
      });
      console.log('Validation failed. Errors: ', errors);
    } else {
      console.log('Validation succeed.');
    }
  });

  return eventErrors;
};

export const sendResponseForUploadedEvent = async (
  response: EventUploadCsv[],
) => {
  let message = 'Saved Successfully';
  let statusCode = 200;

  for (let i = 0; i < response.length; i++) {
    const { eventErrors } = response[i];
    if (eventErrors?.length) {
      message =
        _ERRORS.FILE_UPLOADED_SUCCESSFULLY_BUT_SOME_RECORDS_HAVE_ANOMALIES;
      statusCode = 402;
    }
  }

  return { message, statusCode };
};

export const sendEventUploadUpdate = (
  data: string,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.EVENTS_CHANNEL}`,
    [`${PusherEvents.EVENT_UPLOAD}`],
    data,
  );
};

const getCoordinates = async (address) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await axios.get(url);
    const data = response?.data;
    const event_location = data?.results[0]?.formatted_address;

    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      const coordinates = {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        top_left: {
          latitude: location.lat,
          longitude: location.lng,
        },
        top_right: {
          latitude: location.lat,
          longitude: location.lng,
        },
        bottom_left: {
          latitude: location.lat,
          longitude: location.lng,
        },
        bottom_right: {
          latitude: location.lat,
          longitude: location.lng,
        },
      };
      return { coordinates, event_location };
    } else {
      throw new Error('Geocoding API error: ' + data.status);
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
};

const getTimeZone = async (lat: string, lon: string) => {
  const payload = await axios.get(
    `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${process.env.WEATHER_API_KEY}`,
  );
  const data = payload?.data?.data;
  if (data) {
    return data[0].timezone;
  }

  return '';
};

const eventCategoryValidate = (eventCategory: string) => {
  // Convert input string to lowercase
  const lowerStr = eventCategory.toLowerCase();

  // Check if the string matches 'venue' or 'venues'
  if (lowerStr === 'venue' || lowerStr === 'venues') {
    return 'venues';
    // Check if the string matches 'festival' or 'festivals'
  } else if (lowerStr === 'festival' || lowerStr === 'festivals') {
    return 'festivals';
  } else {
    return 'festivals'; // or throw an error if needed
  }
};

/**
 * manuplation of every event_location
 * convert whole location string to City, State, Country
 */
export const updateEventLocation = async (
  event_location: string,
  geocoder: NodeGeocoder,
) => {
  /**
   * using node-geocoder package to convert whole location string to city, state and country
   * send a event_location one by one in loop and the geocoder-api is converting whole location string to specific data.
   */
  const [result] = await geocoder.geocode(event_location);

  const short_event_location = `${result.city ? result.city + ', ' : ''}${
    result.administrativeLevels.level1long
      ? result.administrativeLevels.level1long + ', '
      : ''
  }${result.country ? result.country : ''}`;

  return short_event_location;
};

const bodyValidation = (body) => {
  body['daily_attendance'] =
    parseInt(body['daily_attendance'].replace(/,/g, '')) || 0;
  body['expected_attendance'] =
    parseInt(body['expected_attendance'].replace(/,/g, '')) || 0;
  body['event_category'] = eventCategoryValidate(body['event_category']);
  body['incident_future'] = true;
  body['staff_future'] = true;
  body['task_future'] = true;
  body['start_date'] = body['public_start_date'];
  body['end_date'] = body['public_end_date'];

  return body;
};

export const getEventByIdHelper = async (
  id: number,
  user: User,
  options?: Options,
) => {
  const event = await Event.findOne({
    where: { id },
    attributes: [
      'id',
      'location',
      'company_id',
      'region_id',
      'cloned',
      'import',
      'event_access_lock',
      'dialer_layout',
      'dialer_dispatch_layout',
      [Sequelize.col('company.name'), 'company_name'],
      [Sequelize.literal('"user"."name"'), 'requestee_name'],
      [Sequelize.literal('"user"."email"'), 'requestee_email'],
      [Event.getStatusNameByKey, 'status'],
      [
        Sequelize.literal(`(
          SELECT CASE
            WHEN CURRENT_DATE BETWEEN public_start_date AND public_end_date AND "Event"."status" = 2 THEN TRUE
            ELSE FALSE
          END
        )`),
        'is_active',
      ],
      eventCadsCount,
      isEventCads,
      isCads,
      moduleCounts(user),
      ...eventAttributes,
      ...eventActiveModulesAttributes,
    ],
    include: getEventByIdInclude(user, isUpperRoles(Number(user['role']))),
    subQuery: false,
    ...options,
  });
  if (!event) throw new NotFoundException(RESPONSES.notFound('Event'));

  return event;
};

export function sendDeniedRequestEvent(
  data,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.EVENTS_CHANNEL}`,
    [PusherEvents.REQUEST_DENIED_EVENT],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export const eventMetaCounts = async (
  user: User,
  companyAndSubcompaniesIds: number[],
  subCompanies: number[],
  company_id: number,
) => {
  // getting companies count - All companies count even parent or child company
  const companiesCount = await Company.count({
    where: await companiesCountWhere(
      user,
      companyAndSubcompaniesIds,
      company_id,
    ),
    include: [{ model: Company, as: 'parent', attributes: [] }],
    benchmark: true,
  });

  // subcompanies count [iOS requirement]
  const subCompaniesCount = await Company.count({
    where: await companiesCountWhere(user, subCompanies, company_id, true),
    benchmark: true,
  });

  // getting pinned incident types count [iOS requirement]
  const pinnedIncidentTypesCount = await IncidentType.count({
    where: pinnedIncidentTypeWhere(company_id, companyAndSubcompaniesIds),
    benchmark: true,
  });

  return { companiesCount, subCompaniesCount, pinnedIncidentTypesCount };
};

export const createEventInitialData = async (
  configService: ConfigService,
  user: User,
  transaction: Transaction,
  event: Event,
) => {
  if (configService.get('ENV') === 'prod') {
    // auto creation of tasks and auto upload some attachments
    await addTasksAndAttachments(event.company_id, event.id, user, transaction);
  }

  await createInitialAssociatedData(event, transaction);

  await createMessageSettingType(event.id, transaction);

  if (
    user['role'] === RolesNumberEnum.SUPER_ADMIN ||
    user['role'] === RolesNumberEnum.ONTRACK_MANAGER ||
    user['role'] === RolesNumberEnum.ADMIN
  ) {
    await EventUser.create(
      {
        event_id: event.id,
        user_id: user.id,
        uid: uid(25),
      },
      { transaction },
    );
  }
};

export const sendEmailOnRequestStatusChange = async (
  oldRequestedStatus: string,
  updatedEvent: Event,
  communicationService: CommunicationService,
) => {
  // Email Notification | Sending email in only case of Approval of Requested Event
  if (
    oldRequestedStatus !== REQUEST_STATUS.APPROVED &&
    updatedEvent['request_status'] === REQUEST_STATUS.APPROVED
  ) {
    try {
      const startDate = formatDate(updatedEvent.public_start_date);
      const endDate = formatDate(updatedEvent.public_end_date);

      const eventData = {
        email: [updatedEvent['requestee_email']],
        requesteeName: updatedEvent['requestee_name'],
        name: updatedEvent.name,
        message: `The Requested Event '${updatedEvent.name}' has been created in OnTrack.`,
        company: updatedEvent['company_name'],
        eventDates: `${startDate} - ${endDate}`,
      };

      await communicationService.communication(
        {
          data: eventData,
          template: TemplateNames.UPDATE_REQUEST_EVENT,
          subject: 'Requested Event Status',
        },
        'send-email',
      );
    } catch (err) {
      console.log(
        '🚀 ~ Error on sending Email - Update Request Event Status ~ err:',
        err,
      );
    }

    try {
      const message = `The Requested Event '${updatedEvent.name}' has been created in OnTrack.`;
      const message_html = `<strong>${updatedEvent.name}</strong> has been created in OnTrack.`;

      await createNotification(
        {
          message,
          message_html,
          module: NotificationModule.EVENT,
          type: NotificationType.EVENT_APPROVAL,
          company_id: updatedEvent?.company_id,
          module_id: updatedEvent.id,
        },
        [updatedEvent.requestee_id],
      );
    } catch (err) {
      console.log('🚀 ~ err:', err);
    }
  }
};

const createDefaultIncidentTypes = async (data, event, transaction) => {
  let _data = null;
  let company: Company = null;

  company = await isCompanyExist(event.company_id);

  const coreIncidentType = await IncidentType.findOne({
    where: {
      company_id: company.parent_id || company.id,
      parent_id: null,
      name: `[Test ${data[1]}]`,
      is_test: true,
    },
    attributes: ['id'],
  });

  if (!company.parent_id) {
    if (!coreIncidentType)
      _data = await data[0].create(
        {
          name: `[Test ${data[1]}]`,
          company_id: company.id,
          is_test: true,
          incident_type_translations: {
            translation: `[Test ${data[1]}]`,
            language: company.default_lang,
          },
        },
        {
          include: [{ association: 'incident_type_translations' }],
          transaction,
          raw: true,
        },
      );
  } else {
    if (coreIncidentType) {
      _data = await data[0].create(
        {
          name: `[Test ${data[1]}]`,
          company_id: company.id,
          is_test: true,
          parent_id: coreIncidentType.id,
          incident_type_translations: {
            translation: `[Test ${data[1]}]`,
            language: company.default_lang,
          },
        },
        {
          include: [{ association: 'incident_type_translations' }],
          transaction,
          raw: true,
        },
      );
    } else {
      _data = await data[0].create(
        {
          name: `[Test ${data[1]}]`,
          company_id: company.parent_id,
          is_test: true,
          incident_type_translations: {
            translation: `[Test ${data[1]}]`,
            language: company.default_lang,
          },
          variations: {
            name: `[Test ${data[1]}]`,
            incident_type_translations: {
              translation: `[Test ${data[1]}]`,
              language: company.default_lang,
            },
          },
        },
        {
          include: [
            { association: 'incident_type_translations' },
            {
              association: 'variations',
              include: [{ association: 'incident_type_translations' }],
            },
          ],
          transaction,
          raw: true,
        },
      );
    }
  }

  return [_data];
};
