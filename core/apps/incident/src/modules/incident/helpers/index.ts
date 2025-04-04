import moment from 'moment';
import {
  BulkCreateOptions,
  Op,
  Order,
  QueryTypes,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  RESPONSES,
  StatusFilter,
  CsvOrPdf,
  SortBy,
  IncidentPriorityApi,
  ResolvedIncidentNoteStatusApi,
  IncidentPriority,
  ERRORS,
  IosInterruptionLevel,
  MessageableType,
  Editor,
  IncidentCountStatus,
  ObjectWithNumbersValue,
  CellNumbersForAlerts,
  IncidentStatsByStatus,
  IncidentDashboardStats,
  HourlyData,
  ContactType,
  TemplateNames,
  WhereClause,
  isWithRestrictedVisibility,
  ScanType,
} from '@ontrack-tech-group/common/constants';
import { PolymorphicType } from '@ontrack-tech-group/common/constants';
import {
  Camper,
  Department,
  Event,
  Incident,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  ResolvedIncidentNote,
  User,
  UserIncidentDivision,
  Scan,
  EventDepartment,
  PriorityGuide,
  Alert,
  IncidentDepartmentUsers,
  Image,
  IncidentCommentStatus,
  CompanyContact,
  LegalGroup,
} from '@ontrack-tech-group/common/models';
import {
  getDateOrTimeInTimeZone,
  getIndexOfScanType,
  getUserRole,
  humanizeTitleCase,
  isCompanyExist,
  isDepartmentExist,
  isEventExist,
  pushNotificationJsonFormater,
  withCompanyScope,
  withTryCatch,
} from '@ontrack-tech-group/common/helpers';
import {
  ChangeLogService,
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { isLowerRoleIncludingOperationManager } from '@ontrack-tech-group/common/constants';
import { IncidentTypeQueryParamsDto } from '@Modules/incident-type/dto';
import { IncidentDivisionQueryParamsDto } from '@Modules/incident-division/dto';
import { IncidentMainZoneQueryParamsDto } from '@Modules/incident-zone/dto';
import { isSourceExist } from '@Modules/source/helpers';
import { isIncidentZoneExist } from '@Modules/incident-zone/helpers';
import { isIncidentTypeExist } from '@Modules/incident-type/helpers';
import {
  GetIncidentResolvedTimeWithNullZones,
  GetResolvedTimeForNullZones,
  IncidentByPriorityAndStatus,
  IncidentDashboard,
} from '@Common/constants/interfaces';
import {
  IncidentZoneSortingColumns,
  MessageBodyHeading,
  OrderByGroup,
  SortColumn,
  userScanType,
} from '@Common/constants/constants';
import { sendPushNotificationAndSMS } from '@Common/helpers';
import { CloneDto } from '@Common/dto';

import {
  IncidentQueryParamsDto,
  DepartmentStaffDto,
  UpdateIncidentDto,
  UploadIncidentRecordDto,
  CreateIncidentDto,
  UploadIncidentDto,
  IncidentOverviewStatsQueryParamsDto,
} from '../dto';

import {
  divisionLockEditAccess,
  divisionlockWithRestrictedVisibility,
  divisionRawInclude,
  orderByPrioritySequence,
} from './queries';
import { getIncidentWhereQuery } from './where';
import { alertInclude, getIncidentExistInclude } from './includes';
import { sendIncidentUpdateForUpload } from './sockets';
import {
  CountsByStatusAndPriority,
  CreateByOrUpdateBy,
  GetIncidentCount,
  LegalCountsInterface,
} from './interfaces';
import { countsForLegalAttributes } from './attributes';

export const createByOrUpdateBy = async (
  createdByOrUpdateByType: string,
  createByOrUpdateBy: number,
): Promise<CreateByOrUpdateBy> => {
  let creatorOrUpdatorRole: string | null = null;

  if (createdByOrUpdateByType === 'Camper') {
    let creatorOrUpdator = null;
    if (createByOrUpdateBy) {
      creatorOrUpdator = await Camper.findByPk(createByOrUpdateBy, {
        attributes: [],
      });
    }

    creatorOrUpdatorRole = creatorOrUpdator?.constructor.name ?? null;
    return {};
  } else {
    let creatorOrUpdator = null;
    if (createByOrUpdateBy) {
      creatorOrUpdator = await User.findByPk(createByOrUpdateBy, {
        attributes: ['id', 'name', 'cell', 'role'],
      });
    }

    creatorOrUpdatorRole =
      creatorOrUpdator && getUserRole(creatorOrUpdator) === 0
        ? 'super_admin'
        : creatorOrUpdator && getUserRole(creatorOrUpdator) === 1
          ? 'admin'
          : 'staff';

    return {
      id: creatorOrUpdator?.id,
      name: creatorOrUpdator?.name,
      cell: creatorOrUpdator?.cell,
      type: humanizeTitleCase(creatorOrUpdatorRole),
    };
  }
};

export const isIncidentExist = async (
  id: number,
  user: User,
  event_id?: number,
  location?: boolean,
): Promise<Incident> => {
  let incident = await Incident.findOne({
    where: { id, ...(event_id ? { event_id } : {}) },
    attributes: [
      'id',
      'parent_id',
      'incident_type_id',
      'incident_zone_id',
      'event_id',
      [Incident.getStatusNameHumanCase, 'status'],
      [Incident.getDashboardPriorityNameByKey, 'priority'],
      [Sequelize.literal(`incident_types.name`), 'incident_type'],
      'updated_by',
      'updated_by_type',
      'createdAt',
      'locator_code',
      'description',
      ...divisionLockEditAccess(user),
    ],
    include: [...getIncidentExistInclude(location)],
  });
  if (!incident) throw new NotFoundException(RESPONSES.notFound('Incident'));

  incident = incident.get({ plain: true });

  const hasEditAccess = (incident as Incident & { hasEditAccess: boolean })[
    'hasEditAccess'
  ];

  if (!hasEditAccess && isLowerRoleIncludingOperationManager(getUserRole(user)))
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  return incident as Incident;
};

export const getLegalCompanyContacts = async (
  company_id: number,
): Promise<string[]> => {
  // Get company details
  const company = await isCompanyExist(company_id);

  // First, find legal contacts of the subcompany
  let contacts = await CompanyContact.findAll({
    attributes: ['email'],
    where: {
      company_id: company_id,
      type: ContactType.LEGAL_CONTACT,
    },
    raw: true,
  });

  // If no contacts found, check the parent company
  if (contacts.length === 0 && company.parent_id) {
    contacts = await CompanyContact.findAll({
      attributes: ['email'],
      where: {
        company_id: company.parent_id,
        type: ContactType.LEGAL_CONTACT,
      },
      raw: true,
    });
  }

  return contacts.map((contact) => contact.email);
};

export const sendLegalPrivilegeEmail = async (
  communicationService: CommunicationService,
  legalCompanyEmails: string[],
  legalGroup: LegalGroup,
): Promise<void> => {
  if (!legalCompanyEmails.length) return;

  try {
    await communicationService.communication(
      {
        data: {
          email: legalCompanyEmails,
          incident_id: legalGroup.incident_id,
        },
        template: TemplateNames.LEGAL_PRIVILEGE,
        subject: `[OnTrack Legal] Re: #${legalGroup.incident_id}`,
        threadId: legalGroup.thread_id,
      },
      'send-email',
    );
  } catch (err) {
    console.log('🚀 ~ err:', err);
  }
};

// "incidentAttributeSumExtractor" This function will extract sum of incidents against provided key
export const incidentAttributeSumExtractor = (
  parentArray: string[],
  data: IncidentDashboard[],
  key: 'status' | 'priority',
): ObjectWithNumbersValue => {
  const totalCounts: ObjectWithNumbersValue = {};

  parentArray.forEach((parentMember: string) => {
    const sum = data
      .filter((row: IncidentDashboard) => row[key] === parentMember)
      .map((i) => i.incidentCounts)
      .map(Number)
      .reduce((acc, num) => acc + num, 0);
    totalCounts[parentMember] = sum;
  });

  return totalCounts;
};

export const incidentDashboardStats = (
  incidents: IncidentDashboard[],
): IncidentDashboardStats => {
  const statuses = ['Dispatched', 'Resolved', 'Open', 'Follow Up'];

  const priorities = ['low', 'medium', 'high', 'critical'];

  const incidents_by_status = incidentAttributeSumExtractor(
    statuses,
    incidents,
    'status',
  );

  const incidents_by_priorities = incidentAttributeSumExtractor(
    priorities,
    incidents,
    'priority',
  );

  const hours_data_with_status_counts = getHourlyData(incidents, statuses);

  const statusCount = getStatusCounts(incidents);

  return {
    incidents_by_status,
    incidents_by_priorities,
    statusCount,
    hours_data_with_status_counts,
  };
};

const getHourlyData = (
  incidents: IncidentDashboard[],
  statuses: string[],
): HourlyData => {
  // Initialize an object to hold hourly data for each status
  const hourlyDataByStatus: Record<string, [string, number][]> = {};

  statuses.forEach((status) => {
    hourlyDataByStatus[status] = Array.from({ length: 24 }, (_, i) => [
      `${String(i).padStart(2, '0')}:00`,
      0,
    ]);
  });

  incidents.forEach((incident) => {
    const { status, hour, incidentCounts: count } = incident;
    const validHour = hour === null ? 0 : hour;

    if (statuses.includes(status)) {
      hourlyDataByStatus[incident.status][validHour][1] += count;
    }
  });

  return hourlyDataByStatus;
};

const getStatusCounts = (
  incident: IncidentDashboard[],
): IncidentStatsByStatus => {
  const statusFilters: IncidentStatsByStatus = {
    Dispatched: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    Resolved: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    Open: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    'Follow Up': {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
  };

  incident.forEach((item: IncidentDashboard) => {
    const { status, priority, incidentCounts } = item;
    if (
      statusFilters[status as keyof typeof statusFilters] &&
      statusFilters[status as keyof typeof statusFilters][
        priority as 'low' | 'medium' | 'high' | 'critical'
      ] !== undefined
    ) {
      statusFilters[status as keyof typeof statusFilters][
        priority as 'low' | 'medium' | 'high' | 'critical'
      ] += incidentCounts;
    }
  });

  return statusFilters;
};

export const getDtoObjectsForReport = (
  eventId: number,
): {
  incidentTypeParams: IncidentTypeQueryParamsDto;
  incidentDivisionsParams: IncidentDivisionQueryParamsDto;
  incidentZoneParams: IncidentMainZoneQueryParamsDto;
} => {
  const incidentTypeParams = new IncidentTypeQueryParamsDto();

  incidentTypeParams.event_id = eventId;
  incidentTypeParams.return_resolved_time = true;
  incidentTypeParams.is_assigned = true;
  incidentTypeParams.csv_pdf = CsvOrPdf.PDF;

  const incidentDivisionsParams = new IncidentDivisionQueryParamsDto();

  incidentDivisionsParams.event_id = eventId;
  incidentDivisionsParams.return_resolved_time = true;
  incidentDivisionsParams.is_assigned = true;
  incidentDivisionsParams.csv_pdf = CsvOrPdf.PDF;

  const incidentZoneParams = new IncidentMainZoneQueryParamsDto();

  incidentZoneParams.event_id = eventId;
  incidentZoneParams.return_resolved_time = true;
  incidentZoneParams.sort_column = IncidentZoneSortingColumns.INCIDENTS_COUNT;
  incidentZoneParams.order = SortBy.DESC;

  return { incidentTypeParams, incidentDivisionsParams, incidentZoneParams };
};

export const getDtoObjectsForOverviewPdfNewDesign = (
  eventId: number,
): {
  incidentDivisionsParams: IncidentDivisionQueryParamsDto;
  incidentZoneParams: IncidentMainZoneQueryParamsDto;
} => {
  const incidentDivisionsParams = new IncidentDivisionQueryParamsDto();

  incidentDivisionsParams.event_id = eventId;
  incidentDivisionsParams.is_assigned = true;
  incidentDivisionsParams.csv_pdf = CsvOrPdf.PDF;

  const incidentZoneParams = new IncidentMainZoneQueryParamsDto();

  incidentZoneParams.event_id = eventId;

  return { incidentDivisionsParams, incidentZoneParams };
};

export const getIncidentResolvedTimeWithNullZones = async (
  eventId: number,
  sequelize: Sequelize,
): Promise<GetResolvedTimeForNullZones> => {
  const result: GetIncidentResolvedTimeWithNullZones[] = await sequelize.query(
    `SELECT * FROM get_incident_resolved_time_null_zones(${eventId})`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const response = result[0][
    'get_incident_resolved_time_null_zones'
  ] as GetResolvedTimeForNullZones;

  return response;
};

export const getIncidentsOrder = (
  incidentQueryParamsDto: IncidentQueryParamsDto,
  isMin = false,
): Order => {
  const { group, sort_column, order = SortBy.DESC } = incidentQueryParamsDto;
  let _order: Order = [
    Sequelize.literal(`"Incident"."created_at" ${SortBy.ASC}`),
  ];

  if (group && !sort_column) {
    switch (group) {
      case OrderByGroup.STATUS:
        _order = [
          Incident.orderByStatusSequence,
          Sequelize.literal(`"Incident"."created_at" ${SortBy.DESC}`),
        ];

        break;

      case OrderByGroup.PRIORITY:
        _order = [
          orderByPrioritySequence,
          Sequelize.literal(`"Incident"."created_at" ${SortBy.DESC}`),
        ];
        break;

      case OrderByGroup.STATUS_CHRONOLOGICAL:
        _order = [
          Incident.orderByStatusSequence,
          Sequelize.literal(`"Incident"."created_at" ${SortBy.ASC}`),
        ];
        break;

      case OrderByGroup.PRIORITY_CHRONOLOGICAL:
        _order = [
          orderByPrioritySequence,
          Sequelize.literal(`"Incident"."created_at" ${SortBy.ASC}`),
        ];
        break;

      default:
        break;
    }
  } else if (sort_column) {
    switch (sort_column) {
      case SortColumn.INCIDENT_DIVISIONS:
        _order = [
          isMin
            ? Sequelize.literal(`MIN("incident_divisions"."name") ${order}`)
            : Sequelize.literal(`"incident_divisions"."name" ${order}`),
        ];
        break;

      case SortColumn.INCIDENT_ZONE:
        _order = [
          isMin
            ? Sequelize.literal(`MIN("incident_zone"."name") ${order}`)
            : Sequelize.literal(`"incident_zone"."name" ${order}`),
        ];
        break;

      case SortColumn.INCIDENT_TYPE:
        _order = [
          isMin
            ? Sequelize.literal(`MIN("incident_types"."name") ${order}`)
            : Sequelize.literal(`"incident_types"."name" ${order}`),
        ];
        break;

      case SortColumn.USERS:
        _order = [
          isMin
            ? Sequelize.literal(`MIN("users"."name") ${order}`)
            : Sequelize.literal(`"users"."name" ${order}`),
        ];
        break;

      case SortColumn.PRIORITY:
        _order = [[Incident.getPriorityNameByKeyNewMapping, order]];
        break;

      case SortColumn.STATUS:
        _order = [[Incident.getStatusNameByKey, order]];
        break;

      case SortColumn.EVENT_NAME:
        _order = [Sequelize.literal(`"event"."name" ${order}`)];
        break;

      default:
        _order = [[sort_column, order]];
        break;
    }
  }

  return _order;
};

export const csvToArrayParser = (ids: string): number[] | string[] => {
  if (!ids?.length) return [];

  return ids
    .replace(' ', '')
    .split(',')
    .filter((id: string) => id);
};

export const isUpperRoles = (role: number): boolean => {
  return [0, 1, 26, 27, 28, 30, 32].includes(role);
};

export const formatIncidentCounts = (
  incidentsByPriority: IncidentByPriorityAndStatus[],
  resolvedIncidentNoteCounts: ResolvedIncidentNote[],
): GetIncidentCount => {
  const countsByStatusAndPriority: CountsByStatusAndPriority = {};
  const dispatchedStatuses = [
    'dispatched',
    'archived',
    'in_route',
    'at_scene',
    'responding',
  ];

  const dispatchedCounts: ObjectWithNumbersValue = {};
  const resolvedIncidentNotes: ObjectWithNumbersValue = {};

  incidentsByPriority.forEach((incident: IncidentByPriorityAndStatus) => {
    const { status, priority, count } = incident;

    // It checks if particular status count is already added in object. if not then initialize it with 0.
    if (!countsByStatusAndPriority[status]) {
      countsByStatusAndPriority[status] = { totalCount: 0 };
      countsByStatusAndPriority[status]['totalCount'] = 0;
    }

    // It added count to that status and if already added count then added to that.
    countsByStatusAndPriority[status][priority] =
      (countsByStatusAndPriority[status][priority] || 0) + count;
    countsByStatusAndPriority[status]['totalCount'] += count;
  });

  const allStatuses = Object.values(StatusFilter);

  const allPriorities = Object.values(IncidentPriorityApi);

  // This loop covers if any status with any priority is not exist in the object then add it with 0 in object.
  allStatuses.forEach((status) => {
    if (!countsByStatusAndPriority[status]) {
      countsByStatusAndPriority[status] = { totalCount: 0 };
      countsByStatusAndPriority[status]['totalCount'] = 0;
    }
    allPriorities.forEach((priority) => {
      if (!countsByStatusAndPriority[status][priority]) {
        countsByStatusAndPriority[status][priority] = 0;
        countsByStatusAndPriority[status]['totalCount'] += 0;
      }
    });
  });

  // combine 5 status under dispatched
  const dispatched = dispatchedStatuses.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: any, status) => {
      const statusData = countsByStatusAndPriority[status];
      if (statusData) {
        Object.keys(statusData).forEach((priority) => {
          if (priority !== 'totalCount') {
            acc[priority] = acc[priority] + statusData[priority];
          }
        });
        acc.totalCount += statusData.totalCount;

        // This is for sending total for each dispatched status in a separate object
        dispatchedCounts[status] = statusData.totalCount;
      }
      return acc;
    },
    { totalCount: 0, low: 0, medium: 0, high: 0, critical: 0 },
  );

  const open = countsByStatusAndPriority['open'];

  // formatting 5 status including active that is combination of open and dispatched
  const totalCounts = {
    open: open,
    dispatched: dispatched,
    follow_up: countsByStatusAndPriority['follow_up'],
    resolved: countsByStatusAndPriority['resolved'],
    active: {
      totalCount: open.totalCount + dispatched.totalCount,
      low: open.low + dispatched.low,
      medium: open.medium + dispatched.medium,
      high: open.high + dispatched.high,
      critical: open.critical + dispatched.critical,
    },
  };

  Object.values(ResolvedIncidentNoteStatusApi).forEach((status) => {
    const found = resolvedIncidentNoteCounts.find(
      (note) => (note['status'] as unknown as string) == status,
    ) as ResolvedIncidentNote & { count: number };

    resolvedIncidentNotes[status] = found ? found['count'] : 0;
  });

  // seprate resolve notes from resolve status where note is not exist
  let resolved = countsByStatusAndPriority['resolved'].totalCount;

  const total = Object.values({ ...resolvedIncidentNotes }).reduce(
    (sum, value) => sum + value,
    0,
  );

  if (resolved) resolved -= total;

  return {
    totalCounts,
    dispatchedCounts,
    resolvedIncidentNotesCount: {
      resolved,
      ...resolvedIncidentNotes,
    },
  };
};

export const cloneDepartments = async (
  cloneDepartment: CloneDto,
): Promise<void> => {
  const { current_event_id, clone_event_id } = cloneDepartment;
  const existingDepartment = await EventDepartment.findAll({
    where: { event_id: clone_event_id },
    attributes: ['department_id'],
  });

  const department_ids = existingDepartment.map((data) => data.department_id);

  if (!department_ids.length)
    throw new NotFoundException(RESPONSES.notFound('Departments'));

  for (const department_id of department_ids) {
    await EventDepartment.findOrCreate({
      where: {
        event_id: current_event_id,
        department_id,
      },
    });
  }

  return;
};

export const formatDispatchMessageWithUsers = async (
  eventId: number,
  incident: Incident,
  userIds: number[],
): Promise<{
  messageBody: string;
  userNumbers: CellNumbersForAlerts[];
  notificationBody: string;
}> => {
  // Format message body
  const { messageBody, notificationBody } = await getIncidentMessageBody(
    true,
    eventId,
    incident,
    MessageBodyHeading.DISPATCH,
  );

  // Get all users to send message
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['cell', 'country_code', 'sender_cell'],
  });

  const userNumbers: CellNumbersForAlerts[] = users.map(
    ({ cell, country_code, sender_cell }) => ({
      cell: country_code + cell,
      onlyCells: cell,
      sender_cell,
    }),
  );

  return { messageBody, userNumbers, notificationBody };
};

export const checkDepartmentStaffExist = async (
  departmentStaff: DepartmentStaffDto[],
): Promise<User[]> => {
  // get unique ids for safe side, if any duplicates passed.
  const userIds = [...new Set(departmentStaff.map(({ user_id }) => user_id))];

  const deparmentIds = [
    ...new Set(departmentStaff.map(({ department_id }) => department_id)),
  ];

  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id', 'name'],
  });

  if (users.length !== userIds.length)
    throw new NotFoundException(RESPONSES.notFound('Some Of Users'));

  const departmentCount = await Department.count({
    where: { id: { [Op.in]: deparmentIds } },
  });

  if (departmentCount !== deparmentIds.length)
    throw new NotFoundException(RESPONSES.notFound('Some Of Departments'));

  return users;
};

export const createChangelogForUnlinkDispatchedStaff = async (
  currentUser: User,
  incident_id: number,
  userName: string,
  changeLogService: ChangeLogService,
): Promise<void> => {
  userName = humanizeTitleCase(userName);

  const formatted_log_text = `${userName} — Removed from incident`;

  changeLogService.createChangeLog({
    id: incident_id,
    type: PolymorphicType.INCIDENT,
    column: 'dispatched',
    formatted_log_text,
    editor_id: currentUser.id,
    editor_type: PolymorphicType.USER,
    old_value: '',
    new_value: '',
    additional_values: {},
    commented_by: '', // TODO: remove this
  });
  return;
};

export const checkAllValidationsForUpdateAndCreateIncident = async (
  companyId: number,
  incidentDto: UpdateIncidentDto | CreateIncidentDto,
  user: User,
  isCreated?: boolean,
  incidentId?: number,
): Promise<{
  incident: Incident | null;
  incidentType: IncidentType;
}> => {
  const {
    event_id,
    source_id,
    incident_division_ids,
    incident_type_id,
    incident_zone_id,
  } = incidentDto;

  // checking is incident exist or not
  let incident!: Incident;
  let incidentType!: IncidentType;

  if (!isCreated && incidentId) {
    incident = await isIncidentExist(incidentId, user, event_id);
  }

  if ('reporter_id' in incidentDto) {
    await isDepartmentExist(incidentDto.reporter_id);
  } else if ('department_id' in incidentDto) {
    await isDepartmentExist(incidentDto.department_id);
  }

  if (source_id) await isSourceExist(source_id);

  if (incident_zone_id) await isIncidentZoneExist(incident_zone_id);

  if (incident_type_id)
    incidentType = await isIncidentTypeExist(companyId, incident_type_id);

  if (incidentDto['incident_type'])
    incidentType = await isIncidentTypeExist(
      companyId,
      undefined,
      incidentDto['incident_type'],
    );

  if (incident_division_ids?.length) {
    const divisionCount = await IncidentDivision.count({
      where: { id: { [Op.in]: incident_division_ids } },
    });

    if (divisionCount !== incident_division_ids.length) {
      throw new NotFoundException(
        RESPONSES.notFound('Some Of Incident Divisions'),
      );
    }
  }

  return { incident, incidentType };
};

export const getCellNumbersForAlerts = (
  alerts: Alert[],
): CellNumbersForAlerts[] => {
  const userNumbers = [];

  for (const alert of alerts) {
    if (alert.sms_alert) {
      const contact = alert.user
        ? {
            cell: alert.user?.country_code + alert.user?.cell,
            onlyCell: alert.user?.cell,
            sender_cell: alert.user?.sender_cell,
          }
        : {
            cell:
              alert.event_contact?.country_code +
              alert.event_contact?.contact_phone,
            onlyCell: alert.event_contact?.contact_phone,
          };
      userNumbers.push(contact);
    }
  }

  return userNumbers;
};

export const getEmailsForAlerts = (alerts: Alert[]): string[] => {
  const userEmails = [];

  for (const alert of alerts) {
    if (alert.email_alert) {
      const email = alert.user
        ? alert.user?.email
        : alert?.event_contact?.contact_email;

      email && userEmails.push(email);
    }
  }

  return userEmails;
};

export const sendAlertEmailAndSmsOnPriorityChange = async (
  prevPriority: string,
  event_id: number,
  priority: string,
  incident: Incident,
  communicationService: CommunicationService,
): Promise<void> => {
  let prevPriorityGuide = null;

  // get alerts for current priority set.
  const priorityGuide = await PriorityGuide.findOne({
    where: {
      event_id,
      priority:
        IncidentPriority[
          priority.toUpperCase() as keyof typeof IncidentPriority
        ],
    },
    include: alertInclude(event_id),
  });

  // if newly set priority is downgraded then we need to find alerts for previous priority as well.
  if (
    prevPriority &&
    IncidentPriority[priority.toUpperCase() as keyof typeof IncidentPriority] <
      IncidentPriority[
        prevPriority.toUpperCase() as keyof typeof IncidentPriority
      ]
  ) {
    prevPriorityGuide = await PriorityGuide.findOne({
      where: {
        event_id,
        priority:
          IncidentPriority[
            prevPriority.toUpperCase() as keyof typeof IncidentPriority
          ],
      },
      include: alertInclude(event_id),
    });
  }

  // if no alerts exist for these then return from function
  if (
    !priorityGuide?.priority_guide_alerts?.length &&
    !prevPriorityGuide?.priority_guide_alerts?.length
  ) {
    return;
  }

  const event: Event | null = await Event.findByPk(event_id, {
    attributes: ['name', 'company_id', 'incident_future_v2'],
  });

  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  // this section of code in if condition is to send alerts for newly set priority
  if (priorityGuide?.priority_guide_alerts?.length) {
    const alerts = priorityGuide?.priority_guide_alerts;
    const userNumbers: CellNumbersForAlerts[] = getCellNumbersForAlerts(alerts);
    const userEmails = getEmailsForAlerts(alerts);

    const { messageBody, rawData } = await getIncidentMessageBody(
      false,
      event_id,
      incident,
      MessageBodyHeading.INCIDENT_CREATE_UPDATE,
      prevPriority,
    );

    const onlyCells: string[] = userNumbers.map(
      (item) => item.onlyCell as string,
    );

    const notificationBody = pushNotificationJsonFormater(
      onlyCells as string[],
      `PRIORITY - ${priority.toUpperCase()}`,
      `INCIDENT TICKET #${incident.id}`,
      {
        messageBody,
        event_id,
        company_id: event.company_id,
        incident_id: incident.id,
        type: 'incident',
        incident_v2: event['incident_future_v2'],
      },
      event,
      IosInterruptionLevel.TIME_SENSITIVE,
    );

    // send message to all dispatched users
    withTryCatch(
      async () => {
        await sendPushNotificationAndSMS(
          messageBody,
          notificationBody,
          userNumbers,
          communicationService,
          MessageableType.INCIDENT,
        );
      },
      'notificationBody',
      'sendPushNotificationAndSMS',
    );

    withTryCatch(
      async () => {
        await communicationService.communication(
          {
            emails: userEmails,
            data: rawData,
          },
          'incident-alert',
        );
      },
      'notificationBody',
      'communicationService',
    );
  }

  // This is to send message alerts when priority downgrade,
  // to the people subscribed to prev priority alerts.
  if (prevPriorityGuide?.priority_guide_alerts?.length) {
    const alerts = prevPriorityGuide?.priority_guide_alerts;
    const userNumbers = getCellNumbersForAlerts(alerts);

    const { messageBody } = await getIncidentMessageBody(
      false,
      event_id,
      incident,
      MessageBodyHeading.ONTRACK_DOWNGRADE_ALERT,
      prevPriority,
      true,
    );

    withTryCatch(
      async () => {
        await communicationService.communication(
          {
            messageBody,
            userNumbers,
            messageable_type: MessageableType.INCIDENT,
          },
          'send-message',
        );
      },
      'sendAlertEmailAndSmsOnPriorityChange',
      'communicationService',
    );
  }

  return;
};

export const sendAlertEmailAndSmsOnIncidentTypeChange = async (
  event_id: number,
  incidentTypeId: number,
  incident: Incident,
  communicationService: CommunicationService,
): Promise<void> => {
  const incidentType = await IncidentType.findOne({
    where: { id: incidentTypeId },
    include: alertInclude(event_id),
  });

  if (incidentType?.incident_type_alerts?.length) {
    const alerts = incidentType?.incident_type_alerts;
    const userNumbers = getCellNumbersForAlerts(alerts);
    const userEmails = getEmailsForAlerts(alerts);

    const { messageBody, rawData } = await getIncidentMessageBody(
      false,
      event_id,
      incident,
      MessageBodyHeading.INCIDENT_CREATE_UPDATE,
    );

    const event: Event | null = await Event.findByPk(event_id, {
      attributes: ['name', 'company_id', 'incident_future_v2'],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const onlyCells: string[] = userNumbers.map(
      (item) => item.onlyCell as string,
    );

    const notificationBody = pushNotificationJsonFormater(
      onlyCells,
      `INCIDENT TYPE - ${incidentType.name.toUpperCase()}`,
      `INCIDENT TICKET #${incident.id}`,
      {
        messageBody,
        event_id,
        company_id: event.company_id,
        incident_id: incident.id,
        type: 'incident',
        incident_v2: event['incident_future_v2'],
      },
      event,
      IosInterruptionLevel.TIME_SENSITIVE,
    );

    // send message to all dispatched users
    withTryCatch(
      async () => {
        await sendPushNotificationAndSMS(
          messageBody,
          notificationBody,
          userNumbers,
          communicationService,
          MessageableType.INCIDENT,
        );
      },
      'sendAlertEmailAndSmsOnIncidentTypeChange',
      'sendPushNotificationAndSMS',
    );

    withTryCatch(
      async () => {
        await communicationService.communication(
          {
            emails: userEmails,
            data: rawData,
          },
          'incident-alert',
        );
      },
      'sendAlertEmailAndSmsOnIncidentTypeChange',
      'communicationService',
    );
  }
};

export const getIncidentMessageBody = async (
  isDispatched: boolean,
  eventId: number,
  incident: Incident,
  messageBodyHeading: MessageBodyHeading,
  prevPriority?: string,
  isDowngradeAlert?: boolean,
): Promise<{
  messageBody: string;
  rawData: { [key: string]: number | string };
  notificationBody: string;
}> => {
  let divisionNames = '';
  let zoneLocation = '';

  const event = (await isEventExist(eventId)).get({ plain: true });

  const {
    id,
    status,
    priority,
    createdAt,
    incident_type,
    incident_divisions,
    incident_zone,
    locator_code,
    description,
  } = incident;

  if (incident_divisions.length) {
    divisionNames = incident_divisions
      .map((division) => division.name)
      .join(', ');
  }

  if (incident_zone) {
    zoneLocation = incident_zone.parent?.name
      ? incident_zone.parent?.name + ' > ' + incident_zone.name
      : incident_zone.name;
  }

  const { date, time } = getDateOrTimeInTimeZone(createdAt, event.time_zone);

  let _priority = priority as unknown as string;

  if (
    prevPriority &&
    IncidentPriority[_priority.toUpperCase() as keyof typeof IncidentPriority] <
      IncidentPriority[
        prevPriority.toUpperCase() as keyof typeof IncidentPriority
      ] &&
    !isDowngradeAlert
  ) {
    _priority = prevPriority + ' downgraded to ' + priority;
  }

  // Format message body
  let messageBody = `
${date} - ${time}
ID:${id}
Company: ${event['company_name']}
Event: ${event.name}
City: ${event.short_event_location?.split(',')[0] || ''}
Incident Type: ${incident_type || ''}
Priority: ${_priority}
Status: ${status}
Division: ${divisionNames}
Location: ${zoneLocation}
Location Detail: ${locator_code || ''}
Map Location: https://maps.google.com/?q=${event.location?.['center']?.latitude || ''},${event.location?.['center']?.longitude || ''}
Description: ${description}
Incident Detail: https://ontrack.co/incident-details?event_id=${event.id}&incident_id=${id}
`;

  const rawData: { [key: string]: number | string } = {
    id,
    date,
    time,
    companyName: event['company_name'],
    eventName: event.name,
    city: event.short_event_location?.split(',')[0] || '',
    incidentType: incident_type,
    priority: _priority,
    status,
    divisionNames,
    zoneLocation,
    locatorCode: locator_code,
    latitude: event.location?.['center']?.latitude || '',
    longitude: event.location?.['center']?.longitude || '',
    description,
  };

  let notificationBody: string = '';

  if (isDispatched) {
    notificationBody = messageBody;
  }

  messageBody = `
${messageBodyHeading}
${messageBody}
  `;

  return { messageBody, rawData, notificationBody };
};
export const uploadIncidentCompiler = async (
  uploadIncidentDto: UploadIncidentDto,
  pusherService: PusherService,
  // DATA IS IN SIMPLE JSON WITH DYNAMIC DATA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incidentsData: any[],
  event_id: number,
  currentUser: User,
  transaction?: Transaction,
  isBackgroundJob?: boolean,
): Promise<{ message: string }> => {
  // Conditional transaction handling for bulk create
  await Incident.bulkCreate(incidentsData, {
    include: [
      { association: 'incident_multiple_division' },
      { association: 'location' },
    ],
    ...(transaction && { transaction }), // Use transaction if provided
    editor: { editor_id: currentUser.id, editor_name: currentUser.name },
  } as BulkCreateOptions & { editor: Editor });

  // Conditional transaction handling for Image creation
  if (uploadIncidentDto.file_name && uploadIncidentDto.url) {
    await Image.create(
      {
        name: uploadIncidentDto.file_name,
        url: uploadIncidentDto.url,
        imageable_id: event_id,
        imageable_type: PolymorphicType.EVENT_INCIDENTS,
        creator_id: currentUser.id,
        creator_type: 'User',
        event_id,
      },
      { ...(transaction && { transaction }) }, // Use transaction if provided
    );
  }

  // Commit transaction only if it's provided
  if (transaction) {
    await transaction.commit();
  }

  sendIncidentUpdateForUpload(event_id, pusherService);

  if (isBackgroundJob) {
    pusherService.sendNotification(event_id, currentUser.id, {
      code: 'success',
      message: 'Incidents has been uploaded!',
    });
  }

  return { message: RESPONSES.uploadedSuccessfully('Incidents has been') };
};

export const uploadIncidentsValidations = async (
  incidents: UploadIncidentRecordDto[],
  company_id: number,
  event_id: number,
): Promise<{
  incidentTypes: IncidentType[];
  incidentZones: IncidentZone[];
}> => {
  const incidentZoneIds = Array.from(
    new Set(incidents.map((incident) => incident.incident_zone_id)),
  );
  const incidentTypeIds = Array.from(
    new Set(incidents.map((incident) => incident.incident_type_id)),
  );
  const incidentDivisionIds = Array.from(
    new Set(incidents.map((incident) => incident.incident_division_ids).flat()),
  );

  const incidentZones = await IncidentZone.findAll({
    where: { id: { [Op.in]: incidentZoneIds }, event_id },
    attributes: ['id', 'name', 'longitude', 'latitude'],
  });

  if (incidentZones.length !== incidentZoneIds.length) {
    throw new NotFoundException(RESPONSES.notFound('Some Of Incident Zones'));
  }

  const incidentTypes = await IncidentType.findAll({
    where: { id: { [Op.in]: incidentTypeIds }, company_id },
    attributes: ['id', 'name'],
  });

  if (incidentTypes.length !== incidentTypeIds.length) {
    throw new NotFoundException(RESPONSES.notFound('Some Of Incident Types'));
  }

  const divisionCount = await IncidentDivision.count({
    where: { id: { [Op.in]: incidentDivisionIds }, company_id },
  });

  if (divisionCount !== incidentDivisionIds.length) {
    throw new NotFoundException(
      RESPONSES.notFound('Some Of Incident Divisions'),
    );
  }

  return { incidentTypes, incidentZones };
};

export const getDispatchLogForUser = async (
  incidentId: number,
  userIds: number[],
  eventId: number,
): Promise<Incident | null> => {
  return await Incident.findByPk(incidentId, {
    attributes: ['id'],
    include: [
      {
        model: User,
        as: 'users',
        through: { attributes: [] },
        where: { id: { [Op.in]: userIds } },
        required: false,
        attributes: [
          'id',
          'name',
          'first_name',
          'last_name',
          [Sequelize.literal(User.getStatusByKey), 'status'],
          [
            Sequelize.literal(`(
                SELECT COUNT(DISTINCT "incidents"."id")::INT
                FROM "incidents"
                INNER JOIN "incident_department_users" ON "incidents"."id" = "incident_department_users"."incident_id"
                WHERE "incident_department_users"."department_id" = (
                  SELECT "department_id"
                  FROM "incident_department_users" as "idu"
                  WHERE "idu"."user_id" = "users"."id"
                    AND "idu"."incident_id" = ${incidentId}
                  LIMIT 1
                )
                AND "incidents"."status" != 2 -- here 2 is for resolved status
                AND "incidents"."event_id" = ${eventId}
              )`),
            'activeIncidentsCount',
          ],
          [
            Sequelize.literal(`(
                SELECT JSON_AGG(subquery_results)
                FROM (
                  SELECT
                  CASE
                    WHEN "scans"."id" IS NULL THEN NULL
                    ELSE JSON_BUILD_OBJECT(
                      'id', "scans"."id",
                      'scan_type', ${Scan.getScanTypeByKey},
                      'created_at', to_char("scans"."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                      'department_id', "departments"."id",
                      'department_name', "departments"."name",
                      'dispatcher', (SELECT "created_by"."name" FROM "users" AS "created_by" WHERE "scans"."created_by" = "created_by"."id")
                    )
                  END AS subquery_results
                  FROM "users" AS "_users"
                  INNER JOIN "incident_department_users" ON "users"."id" = "incident_department_users"."user_id" AND "incident_department_users"."incident_id" = "Incident"."id" AND "users"."id" = "incident_department_users"."user_id"
                  LEFT OUTER JOIN "scans" ON "scans"."user_id" = "_users"."id" AND "scans"."incident_id" = "Incident"."id"
                  INNER JOIN "departments" ON "departments"."id" = "scans"."department_id"
                  WHERE "_users"."id" = "users"."id"
                  GROUP BY
                    "incident_department_users"."id",
                    "users"."id",
                    "departments"."id",
                    "scans"."id"
                  ORDER BY
                    "scans"."created_at" DESC
                ) AS subquery_alias
              )`),
            'incident_scans',
          ],
          [
            Sequelize.literal(
              `CAST("users->incident_department_users"."id" AS INTEGER)`,
            ),
            'user_incident_department_id',
          ],
        ],
        include: [
          {
            model: IncidentDepartmentUsers,
            where: { incident_id: incidentId },
            attributes: {
              include: [
                [
                  Sequelize.literal(
                    `CAST("users->incident_department_users"."id" AS INTEGER)`,
                  ),
                  'id',
                ],
              ],
            },
          },
          {
            model: Scan,
            where: { event_id: eventId, scan_type: { [Op.in]: userScanType } },
            attributes: [
              [Scan.getFormattedScanTypeByKey, 'scan_type'],
              'incident_id',
            ],
            required: false,
            order: [['createdAt', SortBy.DESC]],
            limit: 1,
          },
        ],
      },
    ],
  });
};

export const availableDivisionIncidentIds = async (
  incidentDivisionIds: number[],
): Promise<number[]> => {
  const availableDivision = await Incident.findAll({
    benchmark: true,
    where: {
      [Op.and]: Sequelize.literal(`
          "Incident"."id" IN (
          SELECT "incident_id"
          FROM "incident_multiple_divisions"
          WHERE "incident_division_id" IN (${incidentDivisionIds.join(', ')})
          )
        `),
    },
    attributes: ['id'],
  });

  return availableDivision.map((incident) => incident.id);
};

export const unAvailableDivisionIncidentIds = async (
  event_id: number,
): Promise<number[]> => {
  const unAvailableDivision = await Incident.findAll({
    benchmark: true,
    where: {
      event_id,
      id: {
        [Op.notIn]: Sequelize.literal(`
        (SELECT "incident_id"
         FROM "incident_multiple_divisions")
      `),
      },
    },
    attributes: ['id'],
  });

  return unAvailableDivision.map((incident) => incident.id);
};

export const getIncidentCountsHelper = async (
  event_id: number,
  user: User,
  incidentQueryParamsDto: IncidentQueryParamsDto,
  company_id: number,
  _priorities: IncidentPriorityApi[],
  availableDivisionIds: number[],
  unAvailableDivisionIds: number[],
  reporterIds: number[],
): Promise<{
  totalCounts: CountsByStatusAndPriority;
  dispatchedCounts: ObjectWithNumbersValue;
  resolvedIncidentNotesCount: {
    resolved: number;
  } & ObjectWithNumbersValue;
}> => {
  const incidentIds = (
    await Incident.findAll({
      where: await getIncidentWhereQuery(
        incidentQueryParamsDto ||
          ({
            event_id,
          } as IncidentQueryParamsDto),
        company_id || 0,
        user || ({} as User),
        _priorities,
        false,
        availableDivisionIds,
        unAvailableDivisionIds,
        true,
      ),
      attributes: ['id'],
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
        {
          model: ResolvedIncidentNote,
          attributes: [],
          required: false,
        },
        ...(reporterIds?.length
          ? [
              {
                model: Department,
                as: 'reporter',
                attributes: [],
                where: { id: { [Op.in]: reporterIds } },
              },
            ]
          : []),
      ],
    })
  ).map((incident) => incident.id);

  const incidentByPriorityAndStatus = await Incident.findAll({
    where: {
      event_id,
      id: { [Op.in]: incidentIds },
    },
    attributes: [
      [Incident.getStatusNameByKey, 'status'],
      [Incident.getPriorityNameByKeyNewMapping, 'priority'],
      [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
    ],
    group: [`"Incident"."status"`, `"Incident"."priority"`],
    order: [['status', SortBy.ASC]],
    raw: true,
  });

  const resolvedIncidentNoteCounts = await ResolvedIncidentNote.findAll({
    where: {
      event_id,
      incident_id: { [Op.in]: incidentIds },
    },
    attributes: [
      [ResolvedIncidentNote.getStatusNameByKey, 'status'],
      [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
    ],
    group: [`"ResolvedIncidentNote"."status"`],
    raw: true,
  });

  return formatIncidentCounts(
    incidentByPriorityAndStatus as unknown as IncidentByPriorityAndStatus[],
    resolvedIncidentNoteCounts as ResolvedIncidentNote[],
  );
};

export const transformIncidentCountsData = (
  data: Incident[],
): [IncidentCountStatus[], number[]] => {
  const grouped = data.reduce<Record<string, Record<string, number>>>(
    (acc: Record<string, Record<string, number>>, curr) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const status = curr.status!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const priority = curr.priority!;

      if (!acc[status]) {
        acc[status] = {};
      }

      acc[status][priority] = (acc[status][priority] || 0) + 1;
      return acc;
    },
    {},
  );

  const incidentIds = Array.from(new Set(data.map((d) => d.id)));
  const result: IncidentCountStatus[] = [];
  for (const [status, priorities] of Object.entries(grouped)) {
    for (const [priority, count] of Object.entries(priorities)) {
      result.push({ status, priority, count });
    }
  }
  return [result, incidentIds];
};

// DATA IS DYNAMIC AS JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dispatchStaffSerializer = (incident: Incident): any => {
  return incident.users.map((user: User & { incident_scans?: Scan[] }) => {
    const { incident_scans, ...rest } = user; // Destructure incident_scans to exclude it
    const incident_user_last_scan = incident_scans?.reduce(
      (max: Scan, obj: Scan) => (obj?.id > max?.id ? obj : max),
      incident_scans[0],
    );

    return {
      ...rest,
      incident_user_last_scan,
    };
  });
};

export const updateUserCommentStatus = async (
  user_id: number,
  incident_id: number,
  sequelize: Sequelize,
): Promise<boolean> => {
  const [incidentCommentsStatus, created] =
    await IncidentCommentStatus.findOrCreate({
      where: { user_id, incident_id },
    });

  if (!created) {
    // updating updated_at column with raw query
    await sequelize.query(
      'UPDATE incident_comment_statuses SET updated_at = :updatedAt WHERE id = :id',
      {
        replacements: {
          updatedAt: moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
          id: incidentCommentsStatus.id,
        },
      },
    );
  }

  return true;
};

export const getIncidentCountsForLegal = async (
  companyAndSubcompanyIds: number[],
  company_Id?: number,
  keyword?: string,
): Promise<LegalCountsInterface> => {
  return (
    await Incident.findAll({
      attributes: countsForLegalAttributes,
      where: incidentCountsForLegalWhere(
        companyAndSubcompanyIds,
        company_Id,
        keyword,
      ),
      raw: true,
    })
  )[0] as unknown as LegalCountsInterface;
};

export const incidentCountsForLegalWhere = (
  companyAndSubcompanyIds: number[],
  company_id?: number,
  keyword?: string,
): WhereOptions => {
  const where: WhereClause = { is_legal: true };

  if (company_id) where['company_id'] = company_id;
  else if (companyAndSubcompanyIds?.length)
    where['company_id'] = companyAndSubcompanyIds;

  if (keyword) {
    const keywordCondition: WhereOptions[] = [
      { incident_type: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { locator_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      Sequelize.literal(
        `CAST("Incident"."id" AS TEXT) ILIKE '%${keyword.toLowerCase()}%'`,
      ),
    ];

    where[Op.or] = keywordCondition;
  }

  return where;
};

export const getLinkedIncidentIdsForListingV2 = async (
  id: number,
  event_id: number,
  user: User,
) => {
  const _incident = await isIncidentExistHelper(id);

  const _where = isLowerRoleIncludingOperationManager(getUserRole(user))
    ? isWithRestrictedVisibility(getUserRole(user))
      ? divisionlockWithRestrictedVisibility(user.id)
      : divisionRawInclude(user.id)
    : {};

  const incidents = await Incident.findAll({
    benchmark: true,
    where: {
      [Op.or]: [{ id: _incident.parent_id }, { parent_id: id }],
      ..._where,
    },
    attributes: ['id'],
    include: [
      {
        model: Event,
        where: { id: event_id },
        attributes: [],
      },
      {
        model: User,
        as: 'users',
        attributes: [],
      },
    ],
  });

  return incidents;
};

const isIncidentExistHelper = async (id: number): Promise<Incident> => {
  const incident = await Incident.findByPk(id, {
    attributes: ['id', 'parent_id'],
  });

  return incident as Incident;
};

export const createScanAfterIncidentUpdate = async (
  incident_id: number,
  event_id: number,
  user: User,
) => {
  const users = await User.findAll({
    attributes: ['id'],
    include: [
      {
        model: IncidentDepartmentUsers,
        attributes: ['department_id'],
        where: { incident_id },
        required: true,
      },
    ],
  });

  const doneScanType = getIndexOfScanType(ScanType.DONE);

  await Promise.all(
    users.map(async (_user) => {
      const lastScan = await Scan.findOne({
        where: {
          incident_id,
          user_id: _user.id,
        },
        order: [['createdAt', 'DESC']],
      });

      if (!lastScan || lastScan.scan_type !== doneScanType) {
        await Scan.create({
          user_id: _user.id,
          department_id: _user?.incident_department_users[0]?.department_id,
          incident_id,
          event_id,
          created_by: user.id,
          scan_type: doneScanType,
        });
      }
    }),
  );
};

export const mobileOverviewApiQueryParams = (
  incidentOverviewStatsQueryParamsDto: IncidentOverviewStatsQueryParamsDto,
) => {
  const {
    event_id,
    priority,
    type_filter,
    status,
    incident_zone_id,
    has_image_or_comment,
    date,
    keyword,
    department_ids,
    source_id,
    inventory_id,
    location_logged,
    multiple_priorities_filter,
    multiple_statuses_filter,
    total_hourly_data,
  } = incidentOverviewStatsQueryParamsDto;

  const queryParams = new URLSearchParams();
  queryParams.append('event_id', event_id.toString());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appendQueryParam = (key: string, value: any): void => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, String(v).trim()));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  };

  appendQueryParam('priority_filter', priority);
  appendQueryParam('type_filter', type_filter);
  appendQueryParam('status', status);
  appendQueryParam('incident_zone_id', incident_zone_id);
  appendQueryParam('has_image_or_comment', has_image_or_comment);
  appendQueryParam('date', date);
  appendQueryParam('keyword', keyword);
  appendQueryParam('department_id', department_ids);
  appendQueryParam('source_id', source_id);
  appendQueryParam('inventory_id', inventory_id);
  appendQueryParam('location_logged', location_logged);
  appendQueryParam(
    'multiple_priorities_filter',
    multiple_priorities_filter?.split(','),
  );
  appendQueryParam('total_hourly_data', total_hourly_data);
  appendQueryParam(
    'multiple_statuses_filter',
    multiple_statuses_filter?.split(','),
  );

  return queryParams;
};
