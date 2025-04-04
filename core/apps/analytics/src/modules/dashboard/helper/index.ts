import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import NodeGeocoder from 'node-geocoder';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import {
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Alert,
  Company,
  Department,
  Event,
  EventContact,
  Incident,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  ResolvedIncidentNote,
  User,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  DashboardScope,
  EventStatus,
  ERRORS,
  EventStatusAPI,
  IncidentPriority,
  IncidentStatusDashboardType,
  IncidentStatusType,
  PinableType,
  Priority,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getHumanizeTitleCaseEnum,
  getQueryListParam,
  getRegionsAndSubRegions,
  getScopeAndCompanyIds,
  userRegionsWhere,
} from '@ontrack-tech-group/common/helpers';
import {
  findUserPins,
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  DashboardTopFilter,
  IncidentByPriority,
  StatusCount,
} from '@Common/constants';
import {
  CommonFiltersDto,
  ComparisonEventGraphCsvPdfDto,
  ComparisonEventLineGraphDto,
  ComparisonEventPieGraphDto,
  EventsByStatusQueryDto,
  GetMapPointsDto,
  IncidentListDto,
  LiveEventListingDto,
  PinnedEventsIncidentsDto,
} from '../dto';

export const commonWhere = async (
  event_id: number,
  company_id: number,
  dashboard_top_filter: DashboardTopFilter,
  include_subcompanies: boolean,
  isEvent: boolean,
  scopeCompanyIds: number[],
  scope: DashboardScope,
  region_ids?: number[],
  user?: User,
) => {
  const _where = {};
  let _whereCommon = {};

  if (scopeCompanyIds?.length) {
    _whereCommon['id'] = { [Op.in]: scopeCompanyIds };
    _where['company_id'] = { [Op.in]: scopeCompanyIds };
  }

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (region_ids) {
    _whereCommon['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _whereCommon = {
    ..._whereCommon,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  if (event_id) {
    if (scope !== DashboardScope.UNIVERSAL) {
      const event = await Event.findByPk(event_id, {
        include: [
          {
            model: Company,
            where: { id: { [Op.in]: scopeCompanyIds } },
            attributes: [],
          },
        ],
        attributes: ['id'],
      });

      if (!event) throw new UnauthorizedException();
    }
    _where[isEvent ? 'id' : 'event_id'] = event_id;
  } else if (company_id && scope !== DashboardScope.ADMIN) {
    _where['company_id'] = company_id;

    // below condition would not run in global and admin view
    if (
      dashboard_top_filter === DashboardTopFilter.PARENT &&
      include_subcompanies
    ) {
      const subcompanyIds = (
        await Company.findAll({
          where: { parent_id: company_id },
          attributes: ['id'],
        })
      ).map((company) => company.id);
      _where['company_id'] = { [Op.in]: [...subcompanyIds, company_id] };
    }
  } else if (dashboard_top_filter) {
    const where = {};

    if (dashboard_top_filter === DashboardTopFilter.PARENT) {
      if (!include_subcompanies) where['parent_id'] = null;
    } else if (dashboard_top_filter === DashboardTopFilter.CHILD) {
      where['parent_id'] = { [Op.ne]: null };
    }

    if (
      dashboard_top_filter !== DashboardTopFilter.EVENT &&
      !include_subcompanies &&
      scope === DashboardScope.UNIVERSAL
    ) {
      const companies = await Company.findAll({
        where: { ...where, ..._whereCommon },
        attributes: ['id'],
      });
      const companyIds = companies.map((company) => company.id);

      _where['company_id'] = { [Op.in]: companyIds };
    }

    if (scope !== DashboardScope.UNIVERSAL) {
      let _companies = [];

      if (scope === DashboardScope.GLOBAL) {
        _companies = (
          await Company.findAll({
            where: _whereCommon,
            attributes: ['id'],
          })
        ).map((company) => company.id);

        _where['company_id'] = {
          [Op.in]: _companies,
        };
      }
    }
  } else if (!dashboard_top_filter) {
    let _companies = [];

    if (region_ids && scope === DashboardScope.UNIVERSAL) {
      _companies = (
        await Company.findAll({
          where: _whereCommon,
          attributes: ['id'],
        })
      ).map((company) => company.id);

      _where['company_id'] = {
        [Op.in]: _companies,
      };
    } else if (scope !== DashboardScope.UNIVERSAL) {
      _companies = (
        await Company.findAll({
          where: _whereCommon,
          attributes: ['id'],
        })
      ).map((company) => company.id);

      _where['company_id'] = {
        [Op.in]: _companies,
      };
    }
  }

  return _where;
};

/**
 * This function is used to add checks of events and companies on incident queries.
 * For example for which companies or events we want to get incident records.
 * This function is used in different APIs for incident model queries.
 * @param filters
 * @param companyIds
 * @param scope
 * @param region
 * @returns
 */
export const getEventAndCompanyWhere = async (
  filters: CommonFiltersDto,
  companyIds: number[],
  scope: DashboardScope,
  region_ids?: number[],
  user?: User,
) => {
  const {
    event_id,
    company_id,
    dashboard_top_filter,
    year,
    include_subcompanies,
  } = filters;

  const _where = {
    ...(await commonWhere(
      event_id,
      company_id,
      dashboard_top_filter,
      include_subcompanies,
      false,
      companyIds,
      scope,
      region_ids,
      user,
    )),
  };

  if (year) {
    _where['created_at'] = {
      [Op.between]: [
        new Date(`${year}-01-01T00:00:00.000Z`),
        new Date(`${year + 1}-01-01T00:00:00.000Z`),
      ],
    };
  }

  return _where;
};

export const getEventStatusWhere = async (
  filters: CommonFiltersDto,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
) => {
  const {
    event_id,
    company_id,
    dashboard_top_filter,
    year,
    include_subcompanies,
    region_ids,
  } = filters;
  let _where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  _where[Op.and] = [
    {
      [Op.or]: [
        { demo_event: { [Op.eq]: null } },
        { demo_event: { [Op.eq]: false } },
      ],
    },
    {
      [Op.or]: [
        { request_status: { [Op.eq]: null } },
        { request_status: { [Op.notIn]: ['requested', 'denied'] } },
      ],
    },
    year
      ? {
          [Op.and]: [
            { public_start_date: { [Op.lte]: yearEnd } },
            { public_end_date: { [Op.gte]: yearStart } },
          ],
        }
      : {},
  ];

  _where = {
    ...(await commonWhere(
      event_id,
      company_id,
      dashboard_top_filter,
      include_subcompanies,
      true,
      companyIds,
      scope,
      region_ids,
      user,
    )),
    ..._where,
  };

  _where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  const _companyIds = _where['company_id']
    ? _where['company_id'][Op.in]
      ? _where['company_id'][Op.in]
      : [_where['company_id']]
    : [];

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(
      user,
      false,
      false,
      _companyIds,
      null,
      region_ids,
    )),
  };

  return _where;
};

export const getSubcompaniesCountWhere = async (
  companyId: number,
  region_ids: number[],
  user: User,
) => {
  let where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (companyId) where['parent_id'] = companyId;
  else where['parent_id'] = { [Op.ne]: null };

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  return where;
};

export const getMapPointCompanyWhere = async (
  filters: any,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
) => {
  const { company_id, dashboard_top_filter, include_subcompanies, region_ids } =
    filters;
  let where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (company_id) where['id'] = company_id;

  if (
    dashboard_top_filter === DashboardTopFilter.PARENT &&
    !include_subcompanies
  )
    where['parent_id'] = null;

  if (dashboard_top_filter === DashboardTopFilter.CHILD)
    where['parent_id'] = { [Op.ne]: null };

  if (scope !== DashboardScope.UNIVERSAL && !company_id) {
    where['id'] = { [Op.in]: companyIds };
  }

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  return where;
};

export const formatStatusCount = (
  statusesWithCount: StatusCount[],
  page?: number,
  page_size?: number,
) => {
  const otherStatusCounts = {};
  const paginationResults = {};

  statusesWithCount.forEach((statusCount: StatusCount) => {
    if (
      statusCount.status === EventStatusAPI.UPCOMING ||
      statusCount.status === null
    ) {
      otherStatusCounts[EventStatusAPI.UPCOMING] =
        statusCount.count + (otherStatusCounts[EventStatusAPI.UPCOMING] || 0);
    } else {
      otherStatusCounts[statusCount.status] = statusCount.count;
    }
  });

  Object.values(EventStatusAPI)
    .filter((status) => typeof status === 'string')
    .forEach((status) => {
      if (otherStatusCounts[status] === undefined)
        otherStatusCounts[status] = 0;
    });

  Object.keys(otherStatusCounts).forEach((status) => {
    paginationResults[`${status}_pagination`] = calculatePagination(
      otherStatusCounts[status],
      page_size,
      page,
    );
  });

  return {
    ...otherStatusCounts,
    ...paginationResults,
  };
};

export const getCompaniesMapPoints = async (
  commonFiltersDto: any,
  company: typeof Company,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
  parent?: boolean,
) => {
  const { region_ids } = commonFiltersDto;

  // getting regions and subregions of filters
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const filteredRegionQuery = region_ids
    ? ` and "events"."region_id" IN (${regionsAndSubRegions?.length ? regionsAndSubRegions : 'NULL'})`
    : '';
  const userRegionQuery = await userRegionsWhere(user, true);

  const attributes: any = [
    'id',
    'name',
    'region_id',
    'coordinates',
    [
      Sequelize.literal(`(
        SELECT count("events"."id") AS "count" FROM "events" 
        WHERE "events"."deleted_at" IS NULL 
        ${filteredRegionQuery}${userRegionQuery}
        AND ("events"."demo_event" IS NULL OR "events"."demo_event" = false) 
        AND "events"."company_id" = "Company"."id")::INTEGER
        `),
      'events_count',
    ],
    [
      Sequelize.literal(`(
        SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident" 
        INNER JOIN "events" ON "Incident"."event_id" = "events"."id" 
        INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id" 
        AND ("events"."deleted_at" IS NULL AND ("events"."demo_event" IS NULL OR "events"."demo_event" = false)) 
        ${filteredRegionQuery}${userRegionQuery}
        WHERE "Incident"."company_id" = "Company"."id")::INTEGER`),
      'incidents_count',
    ],
  ];

  if (parent) {
    attributes.push(
      [
        Sequelize.literal(
          `(  SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::INTEGER[]) FROM "companies" WHERE "Company"."id"=parent_id)`,
        ),
        'subcompanies_ids',
      ],
      [
        Sequelize.literal(`COALESCE(
            (
              SELECT COUNT(id)::INTEGER FROM "companies" where "Company"."id"=parent_id
            ),
            0
          ) `),
        'subcompanies',
      ],
    );
  }

  const companies = await company.findAll({
    where: await getMapPointCompanyWhere(
      commonFiltersDto,
      companyIds,
      scope,
      user,
    ),
    attributes,
    group: [`"Company"."id"`],
    order: [['incidents_count', SortBy.DESC]],
  });

  return companies;
};

export const getMapPointEventsWhere = async (
  getMapPointsDto: GetMapPointsDto,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
) => {
  const { event_id, year, region, event_status, region_ids } = getMapPointsDto;
  let _where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  _where[Op.and] = [
    {
      [Op.or]: [
        { demo_event: { [Op.is]: null } },
        { demo_event: { [Op.eq]: false } },
      ],
    },
    {
      [Op.or]: [
        { request_status: { [Op.eq]: null } },
        { request_status: { [Op.notIn]: ['requested', 'denied'] } },
      ],
    },
    year
      ? {
          [Op.and]: [
            { public_start_date: { [Op.lte]: yearEnd } },
            { public_end_date: { [Op.gte]: yearStart } },
          ],
        }
      : {},
  ];

  if (event_id) {
    if (scope !== DashboardScope.UNIVERSAL) {
      const event = await Event.findByPk(event_id, {
        include: [
          {
            model: Company,
            where: { id: { [Op.in]: companyIds } },
            attributes: [],
          },
        ],
        attributes: ['id'],
      });

      if (!event) throw new UnauthorizedException();
    }
    _where['id'] = event_id;
  }

  if (scope === DashboardScope.GLOBAL || scope === DashboardScope.ADMIN) {
    _where['company_id'] = { [Op.in]: companyIds };
  }

  if (region) {
    _where['region'] = { [Op.iLike]: `%${region.toLowerCase()}%` };
  }

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(
      user,
      false,
      false,
      (scope === DashboardScope.GLOBAL || scope === DashboardScope.ADMIN) &&
        companyIds,
      null,
      region_ids,
    )),
  };

  if (event_status) {
    // if status is UPCOMING -> Returing events which have null and upcoming status
    if (event_status === 'upcoming') {
      _where['status'] = {
        [Op.or]: [
          {
            [Op.eq]: EventStatus[event_status.toUpperCase()],
          },
          { [Op.eq]: null },
        ],
      };
    } else {
      _where['status'] = EventStatus[event_status.toUpperCase()];
    }
  }

  return _where;
};

export const getIncidentListWhere = async (
  incidentListDto: IncidentListDto,
  statusToBeAdd = true,
  companyIds?: number[],
  scope?: DashboardScope,
  user?: User,
) => {
  const {
    event_id,
    company_id,
    dashboard_top_filter,
    year,
    status,
    keyword,
    include_subcompanies,
  } = incidentListDto;
  const _where = {
    ...(await commonWhere(
      event_id,
      company_id,
      dashboard_top_filter,
      include_subcompanies,
      false,
      companyIds,
      scope,
      null,
      user,
    )),
  };

  _where['priority'] = Priority.CRITICAL;

  if (year) {
    _where['created_at'] = {
      [Op.between]: [
        new Date(`${year}-01-01T00:00:00.000Z`),
        new Date(`${year + 1}-01-01T00:00:00.000Z`),
      ],
    };
  }

  if (status && statusToBeAdd) {
    const statusNumber = IncidentStatusDashboardType[status.toUpperCase()];
    if (statusNumber === IncidentStatusDashboardType.DISPATCHED) {
      // 1=dispatched, 3=archived, 5=in_route, 6=at_scene, 7=responding (all belongs to dispatched)
      _where['status'] = {
        [Op.in]: [1, 3, 5, 6, 7],
      };
    } else _where['status'] = statusNumber;
  }

  if (keyword) {
    _where[Op.or] = [
      { incident_type: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$event.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$company.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      Sequelize.literal(
        `CAST("Incident"."id" AS TEXT) ILIKE '%${keyword.toLowerCase()}%'`,
      ),
    ];
  }

  return _where;
};

export const getTotalListingCountsByTypes = (
  statusesWithCount: StatusCount[],
) => {
  const otherStatusCounts = {};

  statusesWithCount.forEach((statusCount: StatusCount) => {
    otherStatusCounts[statusCount.status] =
      (otherStatusCounts[statusCount.status] || 0) + statusCount.count;
  });

  getHumanizeTitleCaseEnum(IncidentStatusDashboardType).forEach((status) => {
    if (otherStatusCounts[status] === undefined) otherStatusCounts[status] = 0;
  });

  return otherStatusCounts;
};

/**
 * This function is used to include event conditionally.
 * Because records for events which are not demo and deleted only those should be included in all APIs.
 * We are applying region here in case of only events and not for companies.
 * @param event
 * @param region
 * @param dashboard_top_filter
 * @returns
 */
export const getEventInclude = async (
  event: typeof Event,
  user?: User,
  region_ids?: number[],
  incidentInclude: boolean = false,
): Promise<any> => {
  let _where = {};

  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  if (user)
    _where = {
      ..._where,
      ...(await userRegionsWhere(user, false, false, null, null, region_ids)),
    };

  const demoEventCondition = !incidentInclude
    ? {
        [Op.or]: [
          { demo_event: { [Op.is]: null } },
          { demo_event: { [Op.eq]: false } },
        ],
      }
    : {};

  return {
    model: event,
    where: {
      [Op.and]: [
        demoEventCondition,
        {
          [Op.or]: [
            { request_status: { [Op.eq]: null } },
            { request_status: { [Op.notIn]: ['requested', 'denied'] } },
          ],
        },
      ],
      ..._where,
    },
    required: true,
    attributes: [],
  };
};

/**
 * Incident records having testing incident type should not be include in data.
 * @param incidentType
 * @returns
 */
export const getIncidentTypeInclude = (
  incidentType: typeof IncidentType,
): any => {
  return { model: incidentType, attributes: [] };
};

export const getAlertsInclude = (
  event_id: number,
  alert: typeof Alert,
  user: typeof User,
  eventContact: typeof EventContact,
) => {
  return [
    {
      model: alert,
      where: { event_id },
      attributes: ['sms_alert', 'email_alert'],
      include: [
        {
          model: user,
          required: false,
          attributes: ['id', 'name', 'cell', 'country_code', 'email'],
        },
        {
          model: eventContact,
          required: false,
          attributes: [
            'id',
            'name',
            'contact_phone',
            'country_code',
            'contact_email',
            'contact_name',
          ],
        },
      ],
    },
  ];
};

export const getPriorityCountAttributes = (): any => {
  const priorityCounts = [
    [0, 'low_incidents'],
    [1, 'medium_incidents'],
    [2, 'high_incidents'],
    [3, 'critical_incidents'],
  ];

  const aggregateLiteral = priorityCounts.map(([priority, alias]) =>
    Sequelize.literal(`(
    SELECT COUNT(*)::INTEGER
    FROM "incidents"
    LEFT OUTER JOIN "incident_types" AS "incident_types" 
    ON "incidents"."incident_type_id" = "incident_types"."id" 
    WHERE "incidents"."event_id" = "Event"."id"
    AND "incidents"."priority" = ${priority}
  ) AS "${alias}"`),
  );

  return aggregateLiteral;
};

/**
 * manuplation of every event_location
 * convert whole location string to City and Country
 */
export const getCityOrCountryByEventLocation = async (
  event_location: string,
  geocoder: NodeGeocoder,
) => {
  /**
   * using node-geocoder package to convert whole location string to city and country
   * send a event_location one by one in loop and the geocoder-api is converting whole location string to specific data.
   */
  const [result] = await geocoder.geocode(event_location);

  const city = result.city;
  const country = result.country;

  return { city, country };
};

export const getCsvForComparison = async (
  events,
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  // Formatting data for csv
  const formattedEventsForComparison = getFormattedEventsDataForCsv(events);

  // Api call to lambda for getting csv
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedEventsForComparison,
    CsvOrPdf.CSV,
  );

  // Setting Headers for csv and sending csv in response
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="comparison.csv"');
  return res.send(response.data);
};

export const getFormattedEventsDataForCsv = (events) => {
  return events.map((event) => {
    return {
      'Company Name': event.company_name || '--',
      'Event Name': event.name || '--',
      'Event Start Date': event.start_date || '--',
      'Event End Date': event.end_date || '--',
      'Event Country': event['country'] || '--',
      'Event City': event['city'] || '--',
      'Event Venue': event.venue_name || '--',
      'Daily Attendance': event.daily_attendance || '--',
      'Total Attendence': event.expected_attendance || '--',
      'Total Incidents Logged': event['incident_count'] || 0,
      'Critical Incidents': event['critical_incidents'] || 0,
      'High Incidents': event['high_incidents'] || 0,
      'Medium Incidents': event['medium_incidents'] || 0,
      'Low Incidents': event['low_incidents'] || 0,
      'Top Incident Rank 1': event['top_incident_types']?.[0] || '--',
      'Top Incident Rank 2': event['top_incident_types']?.[1] || '--',
      'Top Incident Rank 3': event['top_incident_types']?.[2] || '--',
      'Top Incident Rank 4': event['top_incident_types']?.[3] || '--',
      'Top Incident Rank 5': event['top_incident_types']?.[4] || '--',
    };
  });
};

export const getParentIds = async (
  companyIds: number[],
  company: typeof Company,
  region_ids: number[],
  user: User,
) => {
  let _where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  const parentIds = await company.findAll({
    where: { id: { [Op.in]: companyIds }, parent_id: null, ..._where },
  });

  return parentIds.map(({ id }) => id);
};

export const getSubcompanyIds = async (
  companyIds: number[],
  company: typeof Company,
  user: User,
  region_ids: number[],
) => {
  let _where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  const subcompanyIds = await company.findAll({
    where: {
      id: { [Op.in]: companyIds },
      parent_id: { [Op.ne]: null },
      ..._where,
    },
  });

  return subcompanyIds.map(({ id }) => id);
};

export const getMapIncidentList = async (
  event_id: number,
  companyIds: number[],
  scope: DashboardScope,
) => {
  const _where = {};

  if (event_id) {
    if (scope !== DashboardScope.UNIVERSAL) {
      const event = await Event.findByPk(event_id, {
        include: [
          {
            model: Company,
            where: { id: { [Op.in]: companyIds } },
            attributes: [],
          },
        ],
        attributes: ['id'],
      });
      if (!event) throw new UnauthorizedException();
    }
    _where['event_id'] = event_id;
  }

  _where['status'] = {
    [Op.notIn]: [2, 4], // 2 and 4 for resolved and follow_up status
  };

  return _where;
};

export const checkEventId = async (
  companyIds: number[],
  user: User,
  year: number,
  eventId: number,
  region_ids?: number[],
) => {
  let companyIdsWhere = {};

  if (companyIds.length) {
    companyIdsWhere = { company_id: { [Op.in]: companyIds } };
  } else if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
    throw new UnauthorizedException();
  }

  const event = await Event.findOne({
    where: {
      id: eventId,
      ...companyIdsWhere,
      ...(await eventIdWhere(year, region_ids, user)),
    },
  });

  if (!event) throw new NotFoundException(RESPONSES.notFound('Event'));
};

export const eventIdWhere = async (
  year: number,
  region_ids: number[],
  user: User,
) => {
  let where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  where[Op.and] = [
    {
      [Op.or]: [
        { demo_event: { [Op.is]: null } },
        { demo_event: { [Op.eq]: false } },
      ],
    },
    {
      [Op.or]: [
        { request_status: { [Op.eq]: null } },
        { request_status: { [Op.notIn]: ['requested', 'denied'] } },
      ],
    },
    year
      ? {
          [Op.and]: [
            { public_start_date: { [Op.lte]: yearEnd } },
            { public_end_date: { [Op.gte]: yearStart } },
          ],
        }
      : {},
  ];

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, false, null, null, region_ids)),
  };

  return where;
};

export const checkCompanyId = async (
  companyIds: number[],
  user: User,
  companyId: number,
  filter: DashboardTopFilter,
  region_ids: number[],
) => {
  if (
    !companyIds.includes(companyId) &&
    !user['is_super_admin'] &&
    !user['is_ontrack_manager']
  ) {
    throw new UnauthorizedException("You don't have access to this company");
  }

  const parentWhere = {};

  if (filter === DashboardTopFilter.CHILD) {
    parentWhere['parent_id'] = { [Op.ne]: null };
  } else if (filter === DashboardTopFilter.PARENT) {
    parentWhere['parent_id'] = null;
  }

  const company = await Company.findOne({
    where: {
      id: companyId,
      ...parentWhere,
      ...companyIdWhere(region_ids, user),
    },
    attributes: ['id', 'region_id', 'category'],
  });

  if (!company) throw new NotFoundException(RESPONSES.notFound('Company'));
};

export const companyIdWhere = async (region_ids: number[], user: User) => {
  let where = {};

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, true, null, null, region_ids)),
  };

  return where;
};

export const checkCompanyOrEventId = async (
  companyIds: number[],
  user: User,
  year: number,
  eventId: number,
  companyId: number,
  filter: DashboardTopFilter,
  region_ids: number[],
) => {
  if (eventId) {
    await checkEventId(companyIds, user, year, eventId, region_ids);
  } else if (companyId) {
    await checkCompanyId(companyIds, user, companyId, filter, region_ids);
  }
};

export const getCompanyCommonAttributes = (): any => {
  return [
    'id',
    'name',
    'coordinates',
    'region',
    'region_id',
    'category',
    [
      Sequelize.literal(`COALESCE(
        (
          SELECT COUNT(id)::INTEGER FROM "companies" where "Company"."id"=parent_id
        ),
        0
      ) `),
      'subcompanies',
    ],
    [
      Sequelize.literal(
        '(SELECT count("events"."id") AS "count" FROM "events" WHERE "events"."deleted_at" IS NULL AND ("events"."demo_event" IS NULL OR "events"."demo_event" = false) AND "events"."company_id" = "Company"."id")::INTEGER',
      ),
      'events_count',
    ],
    [
      Sequelize.literal(
        '(SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident" INNER JOIN "events" AS "event" ON "Incident"."event_id" = "event"."id" INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id" AND ("event"."deleted_at" IS NULL AND ("event"."demo_event" IS NULL OR "event"."demo_event" = false)) WHERE "Incident"."company_id" = "Company"."id")::INTEGER',
      ),
      'incidents_count',
    ],
    [Sequelize.literal(`DATE_PART('year', "Company"."created_at")`), 'year'],
  ];
};

export const checkAllEventIds = async (
  companyIds: number[],
  user: User,
  eventIds: number[],
) => {
  let companyIdsWhere = {};

  if (companyIds.length) {
    companyIdsWhere = { company_id: { [Op.in]: companyIds } };
  } else if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
    throw new UnauthorizedException();
  }

  const event = await Event.findAll({
    where: {
      id: { [Op.in]: eventIds },
      ...companyIdsWhere,
    },
    attributes: ['id'],
  });

  if (event.length !== eventIds.length)
    throw new NotFoundException(RESPONSES.notFound('Some of Events are'));
};

export const liveEventsWhere = async (
  liveEventListingDto: LiveEventListingDto,
  companyIds: number[],
  user: User,
) => {
  const { keyword, company_id } = liveEventListingDto;
  let where = {};
  let _companyIds = [];

  if (company_id) {
    if (companyIds.length && !companyIds.includes(company_id)) {
      throw new UnauthorizedException(RESPONSES.noAccess('to this subcompany'));
    }
    where['company_id'] = company_id;
    _companyIds = [company_id];
  } else if (companyIds.length) {
    where['company_id'] = { [Op.in]: companyIds };
    _companyIds = companyIds;
  }

  where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  where[Op.and] = [
    {
      [Op.or]: [
        { demo_event: { [Op.is]: null } },
        { demo_event: { [Op.eq]: false } },
      ],
    },
    {
      [Op.or]: [
        { request_status: { [Op.eq]: null } },
        { request_status: { [Op.notIn]: ['requested', 'denied'] } },
      ],
    },
    keyword
      ? {
          [Op.or]: [
            { '$Event.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
            {
              $short_event_location$: {
                [Op.iLike]: `%${keyword.toLowerCase()}%`,
              },
            },
            { '$company.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
          ],
        }
      : {},
  ];

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, false, _companyIds)),
  };

  return where;
};

export const pinnedEventsIncidentsWhere = (
  pinnedEventsIncidentsDto: PinnedEventsIncidentsDto,
  companyIds: number[],
) => {
  const { keyword, incident_priority, incident_status, department_ids } =
    pinnedEventsIncidentsDto;
  const where = {};

  const departmentIds: any = getQueryListParam(department_ids);

  if (departmentIds?.length) {
    where['reporter_id'] = { [Op.in]: departmentIds };
  }

  if (companyIds.length) {
    where['company_id'] = { [Op.in]: companyIds };
  }

  if (incident_priority) {
    where['priority'] = +IncidentPriority[incident_priority.toUpperCase()];
  }

  if (incident_status) {
    where['status'] = IncidentStatusType[incident_status.toUpperCase()];
  } else {
    where['status'] = { [Op.notIn]: [2, 4] }; // 2 and 4 = resolved and follow_up status of incident
  }

  if (keyword) {
    where[Op.or] = [
      { '$event.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      {
        '$incident_types.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$incident_zone.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$Incident.description$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$incident_department_users->user.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$Incident.id$': convertStringToNumber(keyword),
      },
      {
        '$incident_divisions.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
    ];
  }

  return where;
};

export const getEventPinsWhere = (pinnedEventIds: number[]): any => {
  const where = {
    id: { [Op.in]: pinnedEventIds },
    [Op.or]: [
      { demo_event: { [Op.is]: null } },
      { demo_event: { [Op.eq]: false } },
    ],
  };

  return where;
};

export const getEventPins = async (user: User) => {
  return (await findUserPins(user.id, PinableType.DASHBOARD_EVENT)).map(
    (pins) => pins.pinable_id,
  );
};

export const getEventPinsWithOrder = async (user: User) => {
  return (await findUserPins(user.id, PinableType.DASHBOARD_EVENT)).map(
    ({ pinable_id, order }) => {
      return { event_id: pinable_id, order };
    },
  );
};

export const pinnedEventIncidentsOrder = (
  pinnedEventsIncidentsDto: PinnedEventsIncidentsDto,
) => {
  const { sort_column, order } = pinnedEventsIncidentsDto;
  const _order = [];

  if (sort_column) {
    switch (sort_column) {
      case 'event_name':
        _order.push([Sequelize.literal(`LOWER(event.name)`), order]);
        break;
      case 'incident_zone_name':
        _order.push([Sequelize.literal(`LOWER(incident_zone.name)`), order]);
        break;
      case 'incident_division_name':
        _order.push([
          Sequelize.literal(`LOWER("incident_divisions"."name")`),
          order,
        ]);
        break;
      case 'incident_type':
        _order.push([Sequelize.literal(`LOWER(incident_types.name)`), order]);
        break;
      case 'dispatch_user':
        _order.push([
          [
            Sequelize.fn(
              'LOWER',
              Sequelize.col('incident_department_users->user.name'),
            ),
            order,
          ],
        ]);
        break;
      case 'description':
        _order.push([Sequelize.literal(`LOWER(${sort_column})`), order]);
        break;
      default:
        _order.push([sort_column, order]);
        break;
    }
  } else {
    _order.push(['created_at', SortBy.DESC]);
  }

  return _order;
};

const convertStringToNumber = (value: string) => {
  const regex = /^[0-9]+$/;
  if (regex.test(value)) {
    return +value;
  }
  return null;
};

/**
 * This function generate csv as attachment or return with pdf url for incident listing
 */
export const generateCsvOrPdfForIncidentListing = async (
  params: PinnedEventsIncidentsDto,
  incidents: Incident[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  const { csv_pdf } = params;
  const _incidents = incidents.map((incident) => incident.get({ plain: true }));

  if (csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedIncidentForCsv = getFormattedIncidentsDataForCsv(_incidents);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedIncidentForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="incidents.csv"');

    return res.send(response.data);
  } else if (csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param incidents
 * @returns Formatted object for CSV file for incidents.
 */
export const getFormattedIncidentsDataForCsv = (incidents: Incident[]) => {
  return incidents?.map((incident: Incident) => {
    const incidentDate = incident['created_at'].toISOString().split('T')[0];
    const incidentTime = getTimeInAmPm(incident['created_at']);

    return {
      Id: incident.id || '--',
      Name: incident['event_name'] || '--',
      Date: incidentDate || '--',
      Time: incidentTime || '--',
      Division: incident['incident_divisions'].length
        ? incident['incident_divisions'].map(({ name }) => name).join(',')
        : '--',
      Type: incident['incident_type'] || '--',
      Location: incident['incident_zone_name'] || '--',
      Priority: incident.priority || '--',
      Dispatch: incident['dispatch_user'] || '--',
      Status: incident.status || '--',
      Description: incident.description || '--',
    };
  });
};

// Function to format time as AM/PM
const getTimeInAmPm = (date: Date) => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute < 10 ? '0' : ''}${minute} ${ampm}`;
};

export const getStatusFormat = (_statusCount: Event[]) => {
  // Initialize an object to store the total counts for each status category
  const statusCount = {
    upcoming: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0,
  };

  // Loop through the query results and update the total counts
  for (const item of _statusCount) {
    const status = item.status;
    const count = Number(item['count']);

    // Update the total count for each status category
    if (statusCount.hasOwnProperty(status)) {
      statusCount[status] += count;
    }
  }

  return statusCount;
};

export const getResolvedIncidentNoteByIdHelper = async (id: number) => {
  const resolvedIncidentNote = await ResolvedIncidentNote.findOne({
    where: { id },
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
      include: [
        [
          Sequelize.cast(
            Sequelize.col('"ResolvedIncidentNote"."id"'),
            'integer',
          ),
          'id',
        ],
        [ResolvedIncidentNote.getStatusNameByKey, 'status'],
      ],
    },
  });

  if (!resolvedIncidentNote)
    throw new NotFoundException(RESPONSES.notFound('Resolved Incident Note'));

  return resolvedIncidentNote;
};

export const eventActiveModulesAttributes = [
  'transportation_future',
  'workforce_messaging',
  'vendor_future',
  'staff_future',
  'service_request_future',
  'reservation_future',
  'messaging_capability',
  'message_service',
  'lost_and_found_future',
  'inventory_future',
  'incident_future',
  'guest_messaging',
  'dot_map_service',
  'deposit_full_charges',
  'department_future',
  'camping_future',
  'task_future',
  'ticket_clear_template_future',
];

export const pinnedEventIncidentsAttributes: any = [
  'id',
  'event_id',
  'created_at',
  'logged_date_time',
  'description',
  'department_id',
  'reporter_id',
  [Sequelize.literal('event.name'), 'event_name'],
  [Sequelize.literal('event.time_zone'), 'time_zone'],
  [Sequelize.literal('incident_zone.name'), 'incident_zone_name'],
  [Sequelize.literal('incident_types.name'), 'incident_type'],
  [
    Sequelize.literal('"incident_department_users->user"."name"'),
    'dispatch_user',
  ],
];

export const singleEventAttributes: any = (user: User, event: typeof Event) => {
  const attributes = [
    'id',
    'company_id',
    'name',
    'expected_attendance',
    'daily_attendance',
    [event.getStatusNameByKey, 'status'],
    [
      Sequelize.literal(
        'CASE WHEN CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) = 0 THEN 0 ELSE expected_attendance / CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) END',
      ),
      'average_attendance',
    ],
  ];
  if (user) {
    attributes.push([
      Sequelize.literal('"user_dashboard_pin_events"."order"'),
      'order',
    ]);
  }

  return attributes;
};

export const getEventByStatusQuery = async (
  eventsByStatusQueryDto: EventsByStatusQueryDto,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
  page: number,
  page_size: number,
) => {
  const { company_id, event_status, year, region_ids } = eventsByStatusQueryDto;

  // Added check of regions
  const userRegionQuery = await userRegionsWhere(user, true);

  // filtered region
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const filteredRegionQuery = region_ids
    ? `AND region_id IN (${regionsAndSubRegions.length ? regionsAndSubRegions : 'NULL'})`
    : '';

  const paginationQuery = page_size
    ? `LIMIT ${page_size} OFFSET ${page_size * (page || 0)}`
    : '';

  let statuses = [
    { status: 'on_hold', where: 'status = 0' },
    { status: 'completed', where: 'status = 1' },
    { status: 'in_progress', where: 'status = 2' },
    { status: 'upcoming', where: '(status = 3 OR status IS NULL)' },
  ];

  if (company_id)
    await checkCompanyId(companyIds, user, company_id, null, region_ids);

  if (event_status) {
    statuses = statuses.filter((_status) => _status.status === event_status);
  }

  if (company_id) {
    statuses = statuses.map((_status) => ({
      ..._status,
      where: _status.where + ` AND company_id = ${company_id}`,
    }));
  }

  if (scope !== DashboardScope.UNIVERSAL && companyIds.length && !company_id) {
    statuses = statuses.map((_status) => ({
      ..._status,
      where: _status.where + ` AND company_id IN (${companyIds})`,
    }));
  }

  if (year) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    statuses = statuses.map((_status) => ({
      ..._status,
      where:
        _status.where +
        `AND 
        (public_start_date <= '${yearEnd}' AND public_end_date >= '${yearStart}')
    `,
    }));
  }

  const query = `
    SELECT json_build_object(
      ${statuses.map((_status) => {
        return `'${_status.status}', (
          SELECT json_agg(event_details) FROM 
          (
            SELECT
              json_build_object(
                'id', events.id,
                'name', name,
                'location',location,
                'event_location', event_location,
                'short_event_location', short_event_location,
                'venue_name', venue_name,
                'start_date', start_date,
                'public_start_date', public_start_date,
                'time_zone', time_zone,
                'region_id', region_id,
                'event_category', event_category,
                'total_incidents', (
                  SELECT COUNT(id)
                  FROM incidents
                  WHERE event_id = events.id
                ),
                'critical_incidents', (
                  SELECT COUNT(id)
                  FROM incidents
                  WHERE event_id = events.id AND incidents.priority = 3
                )
              ) AS event_details
            FROM events
            WHERE ${_status.where} AND deleted_at IS NULL AND (demo_event IS NULL OR demo_event IS false)
            ${filteredRegionQuery}${userRegionQuery}
            ${paginationQuery}
        ) AS ${_status.status}
      )`;
      })}
    ) AS grouped_events;
  `;

  return query;
};

export const getEventsByStatusWhere = async (
  eventsByStatusQueryDto: EventsByStatusQueryDto,
  companyIds: number[],
  scope: DashboardScope,
  user: User,
) => {
  const { year, company_id, region_ids } = eventsByStatusQueryDto;
  let _where = {};
  let _companyIds = [];

  // getting regions and subregions
  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  _where[Op.and] = [
    {
      [Op.or]: [
        { demo_event: { [Op.eq]: null } },
        { demo_event: { [Op.eq]: false } },
      ],
    },
    {
      [Op.or]: [
        { request_status: { [Op.eq]: null } },
        { request_status: { [Op.notIn]: ['requested', 'denied'] } },
      ],
    },
    year
      ? {
          [Op.and]: [
            { public_start_date: { [Op.lte]: yearEnd } },
            { public_end_date: { [Op.gte]: yearStart } },
          ],
        }
      : {},
  ];

  if (company_id) {
    _where['company_id'] = company_id;
    _companyIds = [company_id];
  } else if (scope !== DashboardScope.UNIVERSAL) {
    _where['company_id'] = { [Op.in]: companyIds };
    _companyIds = companyIds;
  }

  if (region_ids) {
    _where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(
      user,
      false,
      false,
      _companyIds,
      null,
      region_ids,
    )),
  };

  return _where;
};

export const getCompaniesMapPointsHelper = async (
  eventsByStatusQueryDto: EventsByStatusQueryDto,
  companyIds: number[],
  scope: DashboardScope,
  company: typeof Company,
  user: User,
) => {
  const { dashboard_top_filter, company_id, year, region_ids } =
    eventsByStatusQueryDto;
  let _dashboard_top_filter = dashboard_top_filter;
  let parentCompanies = [];
  let subcompanies = [];

  // We need to get map points for parent companies only if parent is selected from top filter or if not top filter is selected
  // In case of global view, if global is selected then we need to get this.
  if (
    dashboard_top_filter === DashboardTopFilter.PARENT ||
    dashboard_top_filter === DashboardTopFilter.CHILD || // this is added to send subcompanies as well in case of "Parent" filter for iOS
    !dashboard_top_filter ||
    (scope === DashboardScope.GLOBAL &&
      DashboardTopFilter.GLOBAL === dashboard_top_filter)
  ) {
    const parentIds = await getParentIds(companyIds, company, region_ids, user);
    if (
      !dashboard_top_filter ||
      dashboard_top_filter === DashboardTopFilter.CHILD
    ) {
      _dashboard_top_filter = DashboardTopFilter.PARENT;
    }

    if (
      (scope === DashboardScope.GLOBAL &&
        company_id &&
        parentIds.includes(company_id)) ||
      scope === DashboardScope.UNIVERSAL ||
      (scope === DashboardScope.GLOBAL && !company_id)
    ) {
      parentCompanies = await getCompaniesMapPoints(
        {
          year,
          company_id,
          dashboard_top_filter: _dashboard_top_filter,
          region_ids,
        },
        company,
        parentIds,
        scope,
        user,
        true,
      );
    }
  }

  // We need to get map points for sub-companies only if child is selected from top filter or if not top filter is selected
  // In case of global view, if global is selected then we need to get this as well.
  if (
    dashboard_top_filter === DashboardTopFilter.CHILD ||
    dashboard_top_filter === DashboardTopFilter.PARENT || // this is added to send companies as well in case of "Child" filter for iOS
    !dashboard_top_filter ||
    (scope === DashboardScope.GLOBAL &&
      DashboardTopFilter.GLOBAL === dashboard_top_filter)
  ) {
    const subcompanyIds = await getSubcompanyIds(
      companyIds,
      company,
      user,
      region_ids,
    );

    // Re-assign as it has been manipulated above
    _dashboard_top_filter = dashboard_top_filter;

    if (
      !dashboard_top_filter ||
      dashboard_top_filter === DashboardTopFilter.PARENT
    ) {
      _dashboard_top_filter = DashboardTopFilter.CHILD;
    }

    if (
      (scope === DashboardScope.GLOBAL &&
        company_id &&
        subcompanyIds.includes(company_id)) ||
      scope === DashboardScope.UNIVERSAL ||
      (scope === DashboardScope.GLOBAL && !company_id)
    ) {
      subcompanies = await getCompaniesMapPoints(
        {
          year,
          company_id,
          dashboard_top_filter: _dashboard_top_filter,
          region_ids,
        },
        company,
        subcompanyIds,
        scope,
        user,
      );
    }
  }

  if (scope === DashboardScope.ADMIN) {
    parentCompanies = await getCompaniesMapPoints(
      { year, company_id, dashboard_top_filter, region_ids },
      company,
      companyIds,
      scope,
      user,
    );
  }

  return [parentCompanies, subcompanies];
};

export const getUniqueCompanyIdsAgainstPinnedEvents = async (
  user: User,
  event: typeof Event,
) => {
  const pinnedEventIds = await getEventPins(user);
  let companyIds = [];

  if (pinnedEventIds.length) {
    companyIds = [
      ...new Set(
        (
          await event.findAll({
            where: { id: { [Op.in]: pinnedEventIds } },
            attributes: ['company_id'],
          })
        ).map((event) => event.company_id),
      ),
    ];
  }

  return [pinnedEventIds, companyIds] as [number[], number[]];
};

export const checkEventIds = async (
  companyIds: number[],
  user: User,
  eventIds: number[],
) => {
  let companyIdsWhere = {};

  if (companyIds.length) {
    companyIdsWhere = { company_id: { [Op.in]: companyIds } };
  } else if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
    throw new UnauthorizedException();
  }

  const events = await Event.findAll({
    where: {
      id: { [Op.in]: eventIds },
      ...companyIdsWhere,
    },
    attributes: ['id', 'name'],
  });

  if (events.length !== eventIds.length)
    throw new NotFoundException(RESPONSES.notFound('Some Of The Events'));

  return events;
};

export const comparisonLineGraphEventsIncidentsWhere = (
  comparisonEventLineGraphDto:
    | ComparisonEventLineGraphDto
    | ComparisonEventPieGraphDto,
  companyIds: number[],
) => {
  const { incident_priority, incident_status, department_ids } =
    comparisonEventLineGraphDto;
  const where = {};

  const departmentIds = getQueryListParam(department_ids);

  if (departmentIds?.length) {
    where['reporter_id'] = { [Op.in]: departmentIds };
  }

  if (companyIds.length) {
    where['company_id'] = { [Op.in]: companyIds };
  }

  if (incident_priority) {
    where['priority'] = IncidentPriority[incident_priority.toUpperCase()];
  }

  if (incident_status) {
    where['status'] = IncidentStatusType[incident_status.toUpperCase()];
  }

  return where;
};

export const getIncidentIdsForGraphs = async (
  comparisonEventLineGraphDto:
    | ComparisonEventLineGraphDto
    | ComparisonEventPieGraphDto,
  user: User,
) => {
  const { incident_division_ids, incident_type_ids, event_ids } =
    comparisonEventLineGraphDto;

  const { companyIds } = await getScopeAndCompanyIds(user);
  await checkEventIds(companyIds, user, event_ids);

  const incidentDivisionIds = getQueryListParam(incident_division_ids);
  const incidentTypeIds = getQueryListParam(incident_type_ids);

  const incidents = (
    await Incident.findAll({
      where: {
        ...comparisonLineGraphEventsIncidentsWhere(
          comparisonEventLineGraphDto,
          companyIds,
        ),
        event_id: { [Op.in]: event_ids },
      },
      attributes: ['id'],
      include: [
        getIncidentTypeInclude(IncidentType),
        await getEventInclude(Event, user),
        {
          model: IncidentZone,
          attributes: [],
        },
        {
          model: IncidentType,
          attributes: [],
          where: incidentTypeIds?.length
            ? { id: { [Op.in]: incidentTypeIds } }
            : {},
        },
        {
          model: IncidentDepartmentUsers,
          attributes: ['id'],
          include: [
            {
              model: User,
              attributes: [],
            },
          ],
        },
        {
          model: IncidentDivision,
          as: 'incident_divisions',
          through: { attributes: [] },
          required: !!incidentDivisionIds?.length,
          where: incidentDivisionIds
            ? Sequelize.literal(
                `"Incident"."id" IN (SELECT "incident_id" FROM "incident_multiple_divisions" WHERE "incident_division_id" IN (${incidentDivisionIds}))`,
              )
            : {},
          attributes: [],
        },
      ],
    })
  ).map((incident) => incident.id);

  return incidents;
};

export const getFiltersForGraphs = async (
  comparisonEventGraphCsvPdfDto: ComparisonEventGraphCsvPdfDto,
) => {
  const {
    incident_division_ids,
    incident_type_ids,
    department_ids,
    incident_status,
    incident_priority,
  } = comparisonEventGraphCsvPdfDto;

  let department = null;
  let incidentType = null;
  let division = null;

  const incidentDivisionIds = getQueryListParam(incident_division_ids);
  const incidentTypeIds = getQueryListParam(incident_type_ids);
  const departmentIds = getQueryListParam(department_ids);

  if (departmentIds?.length)
    department = await Department.findOne({ where: { id: departmentIds[0] } });

  if (incidentTypeIds?.length)
    incidentType = await IncidentType.findOne({
      where: { id: incidentTypeIds[0] },
    });

  if (incidentDivisionIds?.length)
    division = await IncidentDivision.findOne({
      where: { id: incidentDivisionIds[0] },
    });

  return {
    status: incident_status || '--',
    priority: incident_priority || '--',
    reporter: department ? department.name : '--',
    division: division ? division.name : '--',
    incidentType: incidentType ? incidentType.name : '--',
  };
};

export const formatIncidentsByPriorityCount = (
  incidentsByPriority: IncidentByPriority,
) => {
  return {
    low: 0,
    normal: 0,
    important: 0,
    critical: 0,
    ...incidentsByPriority,
  };
};

export const getUniqueCompanyIdsAgainstEventIds = async (
  user: User,
  event: typeof Event,
  eventIds: number[],
) => {
  // Checking if provided event_ids exist in db and user has access to it or not.
  const { companyIds: userCompanies } = await getScopeAndCompanyIds(user);
  await checkEventIds(userCompanies, user, eventIds);

  let companyIds = [];

  companyIds = [
    ...new Set(
      (
        await event.findAll({
          where: { id: { [Op.in]: eventIds } },
          attributes: ['company_id'],
        })
      ).map((event) => event.company_id),
    ),
  ];

  return companyIds;
};

export const getLabelForChart = (event, day: number) => {
  const { name, public_start_date, public_end_date, filtered_day } = event;

  return `${name} ${
    day
      ? `(${filtered_day})` || ''
      : `(${moment(public_start_date).format('YYYY-MM-DD')} - ${moment(
          public_end_date,
        ).format('YYYY-MM-DD')})`
  }`;
};

export const sendIncidentCountUpdate = async (
  event_id: number,
  pusherService: PusherService,
) => {
  try {
    const event = await Event.findByPk(event_id, {
      attributes: [[Event.getStatusNameByKey, 'status']],
    });

    pusherService.sendModuleCountUpdate({
      event_id,
      module: 'incident_future',
      status: event['status'] as unknown as string,
    });
  } catch (error) {}
};
