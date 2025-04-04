import { Response } from 'express';
import moment from 'moment-timezone';
import { Sequelize } from 'sequelize-typescript';
import { InferAttributes, Op } from 'sequelize';
import {
  ChangeLog,
  Comment,
  Image,
  Incident,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentType,
  Scan,
  User,
} from '@ontrack-tech-group/common/models';
import { getReportsFromLambda } from '@ontrack-tech-group/common/services';
import { CsvOrPdf, PdfTypes } from '@ontrack-tech-group/common/constants';
import {
  getPageAndPageSize,
  getQueryListParam,
  humanizeTitleCase,
  isCompanyExist,
} from '@ontrack-tech-group/common/helpers';
import { ScanType } from '@Common/constants';
import {
  getIncidentNoZonesAvailable,
  getIncidentZoneWithResolvedTime,
} from '@Modules/incident-zone/helpers';
import {
  getIncidentDivisionsWithResolvedTime,
  getIncidentMultipleDivisionsNotAvailable,
} from '@Modules/incident-division/helpers';
import { getIncidentTypeWithIncidentCountOnly } from '@Modules/incident-type/helpers';
import {
  FormattedIncidentData,
  IChangeLog,
  IScan,
} from '@Common/constants/interfaces';

import { IncidentQueryParamsDto } from '../dto';

import { getIncidentsListQueryIncludeCsv } from './includes';
import { incidentAttributesForCsv } from './attributes';
import {
  FormatAndGenerateCsv,
  GeneratePdfForDashboard,
  GeneratePdfForEventIncidentReport,
} from './interfaces';
import { getIncidentforCSVDownload } from './queries';

import {
  availableDivisionIncidentIds,
  getDtoObjectsForOverviewPdfNewDesign,
  getIncidentsOrder,
  unAvailableDivisionIncidentIds,
} from '.';

export const generatePdfForEventIncidentReport = async (
  props: GeneratePdfForEventIncidentReport,
): Promise<Response> => {
  const { incident, withChangelogs, timezone, req, httpService, res } = props;

  const formattedEventIncidentReportDataForPdf =
    getFormattedEventIncidentReportDataForPdf(
      incident,
      withChangelogs,
      timezone,
    );

  // Api call to lambda for getting pdf
  const response = await getReportsFromLambda(
    req.headers.authorization || '',
    httpService,
    formattedEventIncidentReportDataForPdf,
    CsvOrPdf.PDF,
    PdfTypes.EVENT_INCIDENT_REPORT,
  );

  return res.send(response.data);
};

const getFormattedEventIncidentReportDataForPdf = (
  _incident: Incident,
  withChangelogs: boolean,
  timezone: string,
): FormattedIncidentData => {
  const incident = _incident.get({ plain: true });

  const resolvedTime = incident.resolved_time || '00:00:00';

  return {
    ...incident,
    section: incident.section || 'N/A',
    row: incident.row || 'N/A',
    seat: incident.seat || 'N/A',
    status: humanizeTitleCase(incident.status),
    resolved_time: resolvedTime + ' h/m',
    incident_time: formatDateWithoutZero(
      incident.logged_date_time || incident.created_at,
      timezone,
    ),
    created_at: formatTime(incident.created_at, timezone),
    logged_date_time: formatTime(incident.logged_date_time, timezone),
    updated_at: formatDateWithoutZero(incident.updated_at, timezone),
    source: incident.source?.name || 'N/A',
    reporter: incident.reporter || 'N/A',
    incident_type:
      incident.incident_types?.incident_type_translations?.[0]?.translation,
    images:
      incident.images &&
      (incident.images || []).map((image: Image) => ({
        ...image,
        created_at: formatTime(image?.createdAt, timezone),
      })),
    incident_logs:
      incident.incident_logs &&
      formatActivityLogs(incident.incident_logs || [], timezone),
    changelogs: withChangelogs
      ? boldValuesInLogs(
          (incident.incident_logs || []).map((log: ChangeLog) => ({
            ...log,
            created_at: formatTime(log?.dataValues?.created_at, timezone),
          })),
        )
      : null,
    incident_department_users: (incident.incident_department_users || [])
      ?.filter(
        (idu: IncidentDepartmentUsers) => idu?.user?.scans && idu?.department,
      )
      .map((idu: IncidentDepartmentUsers) => ({
        ...idu,
        user: idu.user && {
          ...idu.user,
          scans: (idu.user.scans || []).map((scan: Scan) => {
            const scanType: string = scan.scan_type as unknown as string;
            return {
              scan_type:
                scanType === ScanType.IN_ROUTE
                  ? 'Transport'
                  : scanType === ScanType.AT_SCENE
                    ? 'On Scene'
                    : humanizeTitleCase(scanType),
              created_at: formatTime((scan as IScan).created_at, timezone),
            };
          }),
        },
      })),
    comments: (incident.comments || []).map((comment: Comment) => ({
      ...comment,
      created_at: comment && formatTime(comment?.createdAt, timezone),
    })),
  };
};

// This function is used with bold changelog function
const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters for regex
};

// This function is used with bold changelog function for new and old value
const boldValue = (text: string, value: string): string => {
  if (value) {
    const escapedValue = escapeRegex(value);
    const regex = new RegExp(
      escapedValue
        .split(' ')
        .map((word) => `(?:<b>)?${word}(?:<\/b>)?`)
        .join('\\s*'),
      'gi',
    );
    return text.replace(regex, `<b>${value}</b>`);
  }
  return text;
};

// This function is used with bold changelog function for column value
const boldColumn = (text: string, column: string): string => {
  if (column) {
    const columnVariations = [
      column,
      column.replace(/_/g, ' '),
      column.replace(/_/g, ' ').toLowerCase(),
      column.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      column.toLowerCase(),
      column.toUpperCase(),
      column.replace(/\b\w/g, (char) => char.toUpperCase()),
    ];

    columnVariations.forEach((variation) => {
      const regex = new RegExp(`\\b(${variation})\\b(?!<\/b>)`, 'gi');
      text = text.replace(regex, `<b>$1</b>`);
    });
  }
  return text;
};

const boldValuesInLogs = (changelogs: ChangeLog[]): ChangeLog[] => {
  changelogs.forEach((log) => {
    let column = log['column'];
    const oldValue = log['old_value'];
    const newValue = log['new_value'];
    let formattedText = log['formatted_log_text'];

    if (column === 'reporter_id') column = 'Department';
    else if (column === 'source_id') column = 'Source';
    else if (column === 'updated_by') column = 'User';
    else if (column === 'created_by') column = 'User';
    else if (column === 'incident_zone_id') column = 'Incident Zone';

    formattedText = boldColumn(formattedText, column);
    formattedText = boldValue(formattedText, oldValue);
    formattedText = boldValue(formattedText, newValue);

    log['formatted_log_text'] = formattedText;
  });

  return changelogs;
};

export const formatTime = (timestamp: string, timezone: string): string =>
  moment(timestamp).tz(timezone).format('MM/DD/YY - hh:mm A');

export const formatDateWithoutZero = (
  timestamp: string,
  timezone: string,
): string => moment(timestamp).tz(timezone).format('M/D/YY - h:mm A');

export const formatActivityLogs = (
  changelogs: ChangeLog[],
  timezone: string,
): ChangeLog[] => {
  const statusLogs = ['priority', 'status', 'dispatched'];

  return changelogs
    .filter((log: ChangeLog) => statusLogs.includes(log['column']))
    .map((log: ChangeLog) => {
      const newLog = { ...log };

      if (log.column === 'priority') {
        if (log.old_value === 'important') newLog.old_value = 'high';
        if (log.new_value === 'important') newLog.new_value = 'high';
        if (log.old_value === 'normal') newLog.old_value = 'medium';
        if (log.new_value === 'normal') newLog.new_value = 'medium';
      }

      if (log.column === 'status') {
        if (log.old_value === 'in_route') newLog.old_value = 'transport';
        if (log.new_value === 'in_route') newLog.new_value = 'transport';
        if (log.old_value === 'archived') newLog.old_value = 'arrival';
        if (log.new_value === 'archived') newLog.new_value = 'arrival';
      }
      if (newLog.new_value) {
        newLog.new_value = humanizeTitleCase(newLog.new_value);
      }

      if (newLog.old_value) {
        newLog.old_value = humanizeTitleCase(newLog.old_value);
      }

      return {
        ...newLog,
        created_at: formatTime((log as IChangeLog).created_at, timezone),
      };
    }) as unknown as ChangeLog[];
};

export const formatAndGenerateCsv = async (
  props: FormatAndGenerateCsv,
): Promise<Response> => {
  const { incidents, timezone, req, res, httpService } = props;

  const csvData = incidents?.map((incident) => {
    const {
      id,
      logged_date_time,
      status,
      priority,
      incident_types,
      description,
      incident_divisions,
      users,
      incident_zone,
      department_name,
      comments_count,
      attachments,
      dispatched_units,
    } = incident.get({ plain: true }) as any; // Adding more attributes
    return {
      ID: id,
      Time: moment(logged_date_time || incident.createdAt)
        .tz(timezone)
        .format('YYYY-MM-DD - hh:mm A'),
      Division: incident_divisions?.length
        ? incident_divisions
            .map((division: { name: string }) => division.name)
            .join(', ')
        : 'N/A',
      'Reporting Department': department_name || 'N/A',
      Type: incident_types?.name || 'N/A',
      Priority: humanizeTitleCase(priority as unknown as string),
      Description: description,
      Status: humanizeTitleCase(status as unknown as string),
      Dispatched: users?.length
        ? users.map((user: { name: string }) => user?.name).join(', ')
        : '--',
      Location: incident_zone?.name || 'Field Location Logged',
      Comments: comments_count || 0,
      Attachments: attachments || 0,
      'Dispatched Units': dispatched_units || 0,
      'Resolution Status': incident?.resolved_incident_note?.status || 'N/A',
      'Resolution Note': incident?.resolved_incident_note?.note || 'N/A',
      'Affected Person':
        incident?.resolved_incident_note?.affected_person || 'N/A',
    };
  });

  // Api call to lambda for getting csv
  const response = await getReportsFromLambda(
    req.headers.authorization || '',
    httpService,
    csvData,
    CsvOrPdf.CSV,
  );

  // Setting Headers for csv and sending csv in response
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="incidents.csv"');
  return res.send(response.data);
};

export const generatePdfForDashboard = async (
  props: GeneratePdfForDashboard,
): Promise<Response> => {
  const {
    graphData: { counts, data },
    event,
    incidentTypes,
    incidentZones,
    incidentDivisions,
    filename,
    imageUrl,
    req,
    res,
    httpService,
  } = props;

  // Api call to lambda for getting pdf
  const response = await getReportsFromLambda(
    req.headers.authorization || '',
    httpService,
    {
      imageUrl,
      event,
      incidentTypes,
      incidentZones,
      incidentDivisions,
      totalIncidents: counts.incidentCounts,
      incidentsByStatus: data.incidents_by_status,
      incidentsByPriorities: data.incidents_by_priorities,
      hoursDataWithStatusCounts: data.hours_data_with_status_counts,
    },
    CsvOrPdf.PDF,
    PdfTypes.INCIDENT_DASHBOARD_OVERVIEW_NEW,
    filename,
  );

  return res.send(response.data);
};

export const getTypesZonesDivisionsOverviewPdf = async (
  eventId: number,
  companyId: number,
  sequelize: Sequelize,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  // set dto param object for all 3 entities
  const { incidentDivisionsParams, incidentZoneParams } =
    getDtoObjectsForOverviewPdfNewDesign(eventId);

  const company = await isCompanyExist(companyId);

  // getting incident type with incident counts only
  const incidentTypes: (InferAttributes<IncidentType> & {
    incidents_count: number;
  })[] = await getIncidentTypeWithIncidentCountOnly(
    eventId,
    true,
    companyId,
    company.default_lang,
  );

  const { rows } = (await getIncidentDivisionsWithResolvedTime(
    incidentDivisionsParams,
    companyId,
    sequelize,
  )) as unknown as {
    rows: (IncidentDivision & {
      incidents_count: number;
    })[];
    count: number;
  };

  let incidentDivisions = rows.map((division) => division.get({ plain: true }));

  const incidentMultipleDivisionsNotAvailable =
    await getIncidentMultipleDivisionsNotAvailable(
      companyId,
      eventId,
      sequelize,
    );

  if (incidentMultipleDivisionsNotAvailable) {
    incidentDivisions.push(incidentMultipleDivisionsNotAvailable);

    incidentDivisions = incidentDivisions
      .slice()
      .sort((a, b) => b.incidents_count - a.incidents_count);
  }

  let incidentZones = (
    await getIncidentZoneWithResolvedTime(incidentZoneParams, sequelize)
  ).map((zone) => zone.get({ plain: true }));

  const incidentNoZonesAvailable = await getIncidentNoZonesAvailable(
    companyId,
    eventId,
    sequelize,
  );

  if (incidentNoZonesAvailable) {
    incidentZones.push(incidentNoZonesAvailable);
  }
  incidentZones = incidentZones
    .slice()
    .sort((a, b) => b['incidents_count'] - a['incidents_count']);

  return {
    incidentTypes: incidentTypes.filter((type) => type['incidents_count']),
    incidentDivisions: incidentDivisions.filter(
      (division) => division['incidents_count'],
    ),
    incidentZones: incidentZones.filter((zone) => zone['incidents_count']),
  };
};

export const csvDownload = async (
  incidentQueryParamsDto: IncidentQueryParamsDto,
  user: User,
  companyId: number,
): Promise<Incident[]> => {
  const {
    page,
    page_size,
    event_id,
    incident_division_ids,
    division_not_available,
  } = incidentQueryParamsDto;

  incidentQueryParamsDto.all_statuses = true;
  let availableDivisionIds: number[] = [];
  let unAvailableDivisionIds: number[] = [];

  const incidentDivisionIds: number[] = getQueryListParam(
    incident_division_ids,
  );
  let incidentIds = [];

  const [_page, _page_size] = getPageAndPageSize(page, page_size);

  if (incidentDivisionIds)
    availableDivisionIds =
      await availableDivisionIncidentIds(incidentDivisionIds);

  if (division_not_available)
    unAvailableDivisionIds = await unAvailableDivisionIncidentIds(event_id);

  const incidentsForIds = await getIncidentforCSVDownload({
    incidentQueryParamsDto,
    companyId,
    user,
    availableDivisionIds,
    unAvailableDivisionIds,
    incidentDivisionIds,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    _page,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    _page_size,
  });

  incidentIds = incidentsForIds.map((incident) => incident.id);

  const incidents = await Incident.findAll({
    where: { id: { [Op.in]: incidentIds } },
    attributes: [...incidentAttributesForCsv],
    include: getIncidentsListQueryIncludeCsv(
      incidentDivisionIds,
      division_not_available,
    ),
    subQuery: false,
    order: getIncidentsOrder(incidentQueryParamsDto, true),
    group: [
      `"Incident"."id"`,
      `"reporter"."name"`,
      `"incident_zone"."id"`,
      `"incident_zone->parent"."id"`,
      `"source"."id"`,
      `"incident_divisions"."id"`,
      `"incident_types"."id"`,
      `"users"."id"`,
      `"resolved_incident_note"."id"`,
    ],
  });

  return incidents;
};
