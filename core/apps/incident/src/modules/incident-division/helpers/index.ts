import { Request, Response } from 'express';
import { literal, Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import { NotFoundException, NotImplementedException } from '@nestjs/common';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  CsvOrPdf,
  ERRORS,
  MessageGroupableType,
  MessageType,
  PdfTypes,
  PusherChannels,
  PusherEvents,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  Event,
  EventIncidentDivision,
  Incident,
  IncidentDivision,
  MessageGroup,
} from '@ontrack-tech-group/common/models';
import {
  getFormattedDivisionsCardViewDataForCsv,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import { _ERRORS, IncidentWorkforceSortingColumns } from '@Common/constants';
import { formatEventCamelCaseForPdfs } from '@Common/helpers';
import { GetIncidentDivisionDto, IncidentDivisionQueryParamsDto } from '../dto';
import {
  availableStaffCount,
  departmentsCount,
  divisionAllStaffCount,
  eventsCount,
  getDepartmentCount,
  getDivisionActiveStaffCount,
  getDivisionStaffCount,
  getLinkedIncidentCount,
  incidentsCount,
  isAssigned,
  totalStaffCount,
  unavailableStaffCount,
} from '../queries';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying incident zones.
 */
export const getIncidentDivisionWhereQuery = (
  filters: IncidentDivisionQueryParamsDto,
  company_id: number,
  availableDivisionIds: number[],
  is_assigned?: boolean,
) => {
  const _where = {};

  if (company_id) _where['company_id'] = company_id;

  if (filters.keyword)
    _where['name'] = { [Op.iLike]: `%${filters.keyword.toLowerCase()}%` };

  if (is_assigned === false) {
    _where['id'] = { [Op.notIn]: availableDivisionIds };
  }

  if (filters?.date) {
    const _date = new Date(filters?.date);
    _where['created_at'] = {
      [Op.between]: [
        _date.setHours(0, 0, 0, 0),
        _date.setHours(23, 59, 59, 999),
      ],
    };
  }

  return _where;
};

export const generateCsvOrPdfForDepartmentsCardView = async (
  params: GetIncidentDivisionDto,
  divisions: IncidentDivision[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedDivisionsCardViewDataForCsv =
      getFormattedDivisionsCardViewDataForCsv(divisions);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedDivisionsCardViewDataForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set(
      'Content-Disposition',
      'attachment; filename="event_divisions.csv"',
    );
    return res.send(response.data);
  } else if (params.csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

export const getDivisionWhereFilter = (
  filters: GetIncidentDivisionDto,
): any => {
  const _where = {
    [Op.and]: [],
  };
  const { keyword, department_id, division_id, event_id } = filters;

  if (keyword) {
    _where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  if (division_id) _where['id'] = division_id;

  if (department_id) {
    _where[Op.and].push(
      Sequelize.literal(`"IncidentDivision"."id" IN (
          SELECT DISTINCT "user_incident_divisions"."incident_division_id" FROM "user_incident_divisions"
          LEFT OUTER JOIN "users" ON "user_incident_divisions"."user_id" = "users"."id"
          LEFT OUTER JOIN "department_users" ON "users"."id" = "department_users"."user_id"
          WHERE "department_users"."department_id" = ${department_id}
          AND "user_incident_divisions"."event_id" = ${event_id}
        )`),
    );
  }

  return _where;
};

export const createAndUpdateMessageGroup = async (
  incidentDivision: IncidentDivision,
  event_id: number,
  transaction: Transaction,
) => {
  const { id, company_id, name } = incidentDivision;

  await MessageGroup.findOrCreate({
    where: {
      company_id,
      event_id,
      message_type: MessageType.DIVISION,
      message_groupable_id: id,
      message_groupable_type: MessageGroupableType.INCIDENT_DIVISION,
    },
    defaults: { name },
    paranoid: false,
    transaction,
    useMaster: true,
  });
};

export const getIncidentDivisionAttributes: any = (
  eventId: number,
  pdf = false,
  roleId: number,
  companyId: number,
) => {
  const attributes = [
    'id',
    'name',
    'company_id',
    'created_at',
    [incidentsCount(eventId), 'incidents_count'],
    'updated_at',
  ];

  if (!pdf) {
    attributes.push(
      [eventsCount, 'events_count'],
      totalStaffCount(eventId, companyId),
      availableStaffCount(eventId, companyId, roleId),
      unavailableStaffCount(eventId, companyId),
      departmentsCount(eventId),
      [isAssigned(eventId), 'is_assigned'],
    );
  }

  return attributes;
};

export const getIncidentDivisionsWithResolvedTime = async (
  incidentDivisionQueryParamsDto: IncidentDivisionQueryParamsDto,
  company_id: number,
  sequelize: Sequelize,
  availableDivisionIds?: number[],
  sort_column?: IncidentWorkforceSortingColumns,
  _order?: SortBy,
  role_id?: number,
  page?: number,
  page_size?: number,
) => {
  const { event_id, csv_pdf, is_assigned, return_resolved_time, top_sorted } =
    incidentDivisionQueryParamsDto;
  const incidentDivisionsWithResolvedAverageTime = [];

  const order: any = sort_column // Check if sort_column has a value
    ? [[sort_column || 'updated_at', _order || SortBy.DESC]]
    : csv_pdf === CsvOrPdf.PDF
      ? [[Sequelize.literal('incidents_count'), SortBy.DESC]]
      : top_sorted // Check if top_sorted is true
        ? [[Sequelize.literal('incidents_count'), SortBy.DESC]]
        : [[Sequelize.literal('is_assigned'), SortBy.DESC]];

  const incidentDivisions = await IncidentDivision.findAndCountAll({
    where: getIncidentDivisionWhereQuery(
      incidentDivisionQueryParamsDto,
      company_id,
      availableDivisionIds,
      is_assigned,
    ),
    attributes: getIncidentDivisionAttributes(
      event_id,
      !!(csv_pdf === CsvOrPdf.PDF),
      role_id,
      company_id,
    ),
    include: [
      {
        model: Event,
        where: { id: event_id, company_id },
        attributes: [],
        required: !!is_assigned,
      },
    ],
    order,
    limit: top_sorted ? 10 : page_size || undefined, // Limit is 10 if top_sorted, otherwise page_size
    offset: top_sorted ? 0 : page_size * page || undefined,
  });

  const { rows, count } = incidentDivisions;

  if (return_resolved_time && rows.length) {
    const result = await sequelize.query(
      `SELECT * FROM get_incident_divisions_avg_resolved_time(${event_id}, VARIADIC ARRAY[${[
        rows.map((row) => row.id),
      ]}])`,
      {
        type: QueryTypes.SELECT,
      },
    );

    const response = result[0]['get_incident_divisions_avg_resolved_time'];

    for (const _incidentDivision of rows) {
      const incidentDivision = _incidentDivision.get({ plain: true });

      incidentDivisionsWithResolvedAverageTime.push({
        ...incidentDivision,
        resolved_avg_time: response[_incidentDivision.id]?.avg_resolved_time,
      });
    }
  }

  return {
    rows: return_resolved_time
      ? incidentDivisionsWithResolvedAverageTime
      : rows,
    count,
  };
};

export function sendUpdatedIncidentDivision(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export async function getIncidentMultipleDivisionsNotAvailable(
  company_id: number,
  event_id: number,
  sequelize: Sequelize,
) {
  const incidents = await Incident.findAll({
    attributes: ['id'],
    where: {
      company_id,
      event_id,
      [Op.and]: [
        Sequelize.literal(`NOT EXISTS (
        SELECT 1
        FROM incident_multiple_divisions AS imd
        WHERE imd.incident_id = "Incident"."id"
      )`),
      ],
    },
  });

  if (incidents.length) {
    const incidentIds = incidents.map((row) => row.id);

    const result = await sequelize.query(
      `SELECT * FROM get_incident_avg_resolved_time(${event_id}, VARIADIC ARRAY[${[
        incidentIds,
      ]}])`,
      {
        type: QueryTypes.SELECT,
      },
    );

    return {
      id: 0,
      resolved_avg_time:
        result[0]['get_incident_avg_resolved_time'].avg_resolved_time,
      name: 'N/A',
      company_id,
      incidents_count: incidents.length,
    };
  } else return null;
}

export const getIncidentDivisionsWithResolvedTimeForSockets = async (
  incidentDivisionIds: number[],
  eventId: number,
  sequelize: Sequelize,
) => {
  const incidentDivisions = await IncidentDivision.findAll({
    where: { id: { [Op.in]: incidentDivisionIds } },
    attributes: [
      'id',
      'name',
      'company_id',
      [incidentsCount(eventId), 'incidents_count'],
    ],
  });

  return await getIncidentDivisionResolvedTime(
    incidentDivisions,
    eventId,
    sequelize,
  );
};

export const getIncidentDivisionResolvedTime = async (
  incidentDivisions: IncidentDivision[],
  eventId: number,
  sequelize: Sequelize,
) => {
  const incidentDivisionsWithResolvedAverageTime = [];

  const result = await sequelize.query(
    `SELECT * FROM get_incident_divisions_avg_resolved_time(${eventId}, VARIADIC ARRAY[${[
      incidentDivisions.map((row) => row.id),
    ]}])`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const response = result[0]['get_incident_divisions_avg_resolved_time'];

  for (const _incidentDivision of incidentDivisions) {
    const incidentDivision = _incidentDivision.get({ plain: true });

    incidentDivisionsWithResolvedAverageTime.push({
      ...incidentDivision,
      resolved_avg_time: response[_incidentDivision.id]?.avg_resolved_time,
    });
  }

  return incidentDivisionsWithResolvedAverageTime;
};

export const sendIncidentDivisionAssociationsUpdate = async (
  deletedIds: number[],
  newlyLinkedIds: number[],
  pusherService: PusherService,
  eventId: number,
  sequelize: Sequelize,
  type?: string,
) => {
  let incidentDivisions = [];

  if (newlyLinkedIds.length) {
    incidentDivisions = await getIncidentDivisionsWithResolvedTimeForSockets(
      newlyLinkedIds,
      eventId,
      sequelize,
    );
  }

  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
    [`${PusherEvents.INCIDENT_DIVISION_ASSOCIATION}`],
    { deletedIds, incidentDivisions, type },
  );
};

/**
 * This function generate csv as attachment or return with pdf url for Incident Dashboard
 */
export const csvOrPdfForIncidentDivisionIncidentDashboard = async (
  params: IncidentDivisionQueryParamsDto,
  incidentDivisions: IncidentDivision[],
  event: Event,
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  const { csv_pdf } = params;

  // Extract the year from the event or use the current year
  const year = new Date().getFullYear().toString();

  // Construct the file name in the desired format
  const file_name = `${event.name}-${year}-IncidentsByDivision`;

  const _incidentDivisions = incidentDivisions.filter(
    (type) => type['incidents_count'],
  );

  if (csv_pdf === CsvOrPdf.CSV) {
    const formattedIncidentDivisionDataForCsv =
      getFormattedIncidentDivisionDataForCsv(_incidentDivisions);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedIncidentDivisionDataForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set(
      'Content-Disposition',
      'attachment; filename="incident_divisions.csv"',
    );

    return res.send(response.data);
  } else if (csv_pdf === CsvOrPdf.PDF) {
    // Formatting data for pdf
    const formattedIncidentDivisionDataForPdf =
      getFormattedIncidentDivisionDataForPdf(_incidentDivisions);

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      {
        event: formatEventCamelCaseForPdfs(event),
        incidentDivisions: formattedIncidentDivisionDataForPdf,
        totalIncidentCounts: formattedIncidentDivisionDataForPdf.length,
      },
      CsvOrPdf.PDF,
      PdfTypes.INCIDENT_BY_DIVISION,
      file_name,
    );

    return res.send(response.data);
  }
};

export const getFormattedIncidentDivisionDataForPdf = (
  incidentDivisions: IncidentDivision[],
) => {
  return incidentDivisions.map((incidentDivision) => {
    return {
      name: incidentDivision.name,
      durationTime: incidentDivision['resolved_avg_time'] + ' h/m Avg',
      incidentCount: incidentDivision['incidents_count'],
    };
  });
};

export const getFormattedIncidentDivisionDataForCsv = (
  incidentDivisions: IncidentDivision[],
) => {
  return incidentDivisions.map((incidentDivision) => {
    return {
      'Incident Division': incidentDivision.name,
      Resolution: incidentDivision['resolved_avg_time'] + ' h/m Avg',
      'Linked Incidents': incidentDivision['incidents_count'],
    };
  });
};

export const checkIfAllDivisionsExist = async (
  incidentDivisionIds: number[],
  company_id: number,
) => {
  if (incidentDivisionIds?.length) {
    const divisions = await IncidentDivision.count({
      where: {
        company_id,
        id: { [Op.in]: incidentDivisionIds },
      },
    });

    if (incidentDivisionIds?.length !== divisions)
      throw new NotFoundException(
        _ERRORS.SOME_OF_INCIDENT_DIVISION_ARE_NOT_FOUND,
      );
  }
};

export const getCardViewHelper = async (
  params: GetIncidentDivisionDto,
  companyId: number,
  role_id: number,
) => {
  const { event_id, page_size, page } = params;
  const [_page, _page_size] = getPageAndPageSize(page, page_size);

  const eventAllDivisions = await IncidentDivision.findAndCountAll({
    where: getDivisionWhereFilter(params),
    attributes: [
      'id',
      'name',
      'company_id',
      getDivisionStaffCount(companyId, event_id, role_id),
      getDivisionActiveStaffCount(companyId, event_id, role_id),
      getDepartmentCount(companyId, event_id, role_id),
      divisionAllStaffCount(companyId, role_id),
      getLinkedIncidentCount(event_id),
    ],
    include: [
      {
        model: EventIncidentDivision,
        where: { event_id: params.event_id },
        attributes: [],
      },
    ],
    limit: _page_size || undefined,
    offset: _page_size * _page || undefined,
    distinct: true,
    order: [[literal('LOWER("name")'), SortBy.ASC]],
  });

  const { rows, count } = eventAllDivisions;

  return { rows, count };
};
