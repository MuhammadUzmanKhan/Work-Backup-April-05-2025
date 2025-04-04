import { Op, Sequelize } from 'sequelize';
import { User } from '@ontrack-tech-group/common/models';
import {
  getQueryListParam,
  getRegionsAndSubRegions,
  getUserRole,
  userRegionsWhere,
} from '@ontrack-tech-group/common/helpers';
import {
  EventStatus,
  MultipleEventStatus,
  notUpperRole,
  RolesNumberEnum,
} from '@ontrack-tech-group/common/constants';
import { SubcompaniesWithEvents } from '@Modules/company/dto/subcompany-events.dto';
import { DashboardDropdownsQueryDto } from '@Common/dto';
import {
  EventQueryParams,
  GetEventCardViewCsvParams,
  EventMultipleStatusQueryParams,
  EventMultipleStatusBodyData,
  EventRequestStatusParams,
  WorkforceEventQueryParams,
  UserCompanyEventQueryParams,
} from '../dto';
import { divisionRawIncludeInTask, standaloneQuery } from './query';

export const getEventsWhereQuery = async (
  filters:
    | EventQueryParams
    | GetEventCardViewCsvParams
    | EventRequestStatusParams,
  companyAndSubcompaniesIds: number[],
  requestedEvent?: boolean,
  user?: User,
  allowStatus = true,
) => {
  let _where = {};
  const statuses: any = getQueryListParam(filters['status']);

  if (filters['region_ids']) {
    // getting regions and subregions
    const regionsAndSubRegions = await getRegionsAndSubRegions(
      filters['region_ids'],
    );

    if (regionsAndSubRegions?.length) {
      _where['region_id'] = {
        [Op.in]: regionsAndSubRegions,
      };
    }
  }

  if (requestedEvent) {
    _where['request_status'] = {
      [Op.in]: ['requested', 'denied'],
    };

    if (
      filters instanceof EventRequestStatusParams &&
      filters?.event_category
    ) {
      _where['event_category'] = (
        filters as EventRequestStatusParams
      ).event_category;
    }
  } else if (!filters['include_requested_events']) {
    _where['request_status'] = {
      [Op.or]: [
        {
          [Op.notIn]: ['requested', 'denied'],
        },
        { [Op.eq]: null },
      ],
    };
  }

  if (statuses?.length && allowStatus) {
    const statusConditions = [];

    if (statuses.includes('upcoming')) {
      // Include both 'upcoming' status and null
      statusConditions.push(
        { [Op.eq]: 3 }, // upcoming status
        { [Op.eq]: null },
      );
    }

    // Add other statuses to the conditions
    const mappedStatuses = statuses
      .filter((status: string) => status.toLowerCase() !== 'upcoming')
      .map((status: string) => EventStatus[status.toUpperCase()]);

    if (mappedStatuses?.length) {
      statusConditions.push({ [Op.in]: mappedStatuses });
    }

    _where['status'] = {
      [Op.or]: statusConditions,
    };
  }

  if (filters.company_id)
    _where['company_id'] = { [Op.in]: companyAndSubcompaniesIds };

  if (filters.venue_name) _where['venue_name'] = filters.venue_name;

  if (filters.location)
    _where['event_location'] = {
      [Op.iLike]: `%${filters.location.toLowerCase()}%`,
    };

  if (!filters.keyword) {
    if (filters.start_date && filters.end_date) {
      _where[Op.or] = [
        {
          start_date: {
            [Op.and]: [
              { [Op.gte]: filters.start_date },
              { [Op.lte]: filters.end_date },
            ],
          },
        },
        {
          end_date: {
            [Op.and]: [
              { [Op.gte]: filters.start_date },
              { [Op.lte]: filters.end_date },
            ],
          },
        },
      ];
    }

    if (filters.public_start_date && filters.public_end_date) {
      _where[Op.or] = [
        {
          [Op.and]: [
            { public_start_date: { [Op.lte]: filters.public_end_date } },
            { public_end_date: { [Op.gte]: filters.public_start_date } },
          ],
        },
      ];
    }
  }

  if (filters.event_category) {
    _where['event_category'] = filters.event_category;
  }

  if (filters.keyword) {
    _where[Op.and] = [
      {
        [Op.or]: [
          { name: { [Op.iLike]: `%${filters.keyword.toLowerCase()}%` } },
          { venue_name: { [Op.iLike]: `%${filters.keyword.toLowerCase()}%` } },
          {
            short_event_location: {
              [Op.iLike]: `%${filters.keyword.toLowerCase()}%`,
            },
          },
          {
            '$company.name$': {
              [Op.iLike]: `%${filters.keyword.toLowerCase()}%`,
            },
          },
        ],
      },
    ];
  }

  if (filters['exclude_demo_events']) {
    _where['demo_event'] = {
      [Op.or]: [
        {
          [Op.eq]: false,
        },
        { [Op.eq]: null },
      ],
    };
  }

  if (filters['show_demo_events']) {
    _where['demo_event'] = {
      [Op.eq]: true,
    };
  } else if (filters['show_demo_events'] === false) {
    _where['demo_event'] = {
      [Op.or]: [false, null],
    };
  }

  if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
    user['category'] ? (_where['event_category'] = user['category']) : {};
  }

  // If the logged-in user has the “Task Admin” role, only the events with the Task Module enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.TASK_ADMIN)
    _where['task_future'] = true;

  // If the logged-in user has the “Dotmap Admin” role, only the events with the Dotmap Service enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.DOTMAP_ADMIN)
    _where['dot_map_service_v2'] = true;

  _where = {
    ..._where,
    ...(await userRegionsWhere(user, false, false, companyAndSubcompaniesIds)),
  };

  return _where;
};

export const getEventsOfSubcompanyWhereQuery = async (
  params: SubcompaniesWithEvents,
  user: User,
) => {
  let _where = {};

  if (params.country)
    _where['country'] = {
      [Op.iLike]: `%${params.country.toLowerCase()}%`,
    };

  if (params.keyword)
    _where['name'] = { [Op.iLike]: `%${params.keyword.toLowerCase()}%` };

  if (params?.company_id) {
    _where['company_id'] = params.company_id;
  }

  _where['active'] = true;

  if (user)
    _where = {
      ..._where,
      ...(await userRegionsWhere(user, false, false, [params?.company_id])),
    };

  return _where;
};

export const EventStatusWhereQuery = async (
  multipleStatusArray: EventMultipleStatusBodyData,
  filters: EventMultipleStatusQueryParams,
  companyAndSubcompaniesIds: number[],
  user: User,
  statusCount?: boolean,
) => {
  let _where = {};
  const statusArray = [];

  if (Object.keys(multipleStatusArray.statuses).length && !statusCount) {
    multipleStatusArray.statuses.map((data) => {
      const value = MultipleEventStatus[data.toUpperCase()];
      statusArray.push(value);
    });

    _where['status'] = { [Op.in]: statusArray };
    if (statusArray.includes(MultipleEventStatus.UPCOMING)) {
      _where['status'] = {
        [Op.or]: [{ ..._where['status'] }, { [Op.eq]: null }],
      };
    }
  }

  if (filters.company_id)
    _where['company_id'] = { [Op.in]: companyAndSubcompaniesIds };

  _where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (!user['is_super_admin'] && !user['is_ontrack_manager']) {
    user['category'] ? (_where['event_category'] = user['category']) : {};
  }

  _where = {
    ..._where,
    ...(await userRegionsWhere(user, false, false, companyAndSubcompaniesIds)),
  };

  return _where;
};

export const getWorkforceEventWhereQuery = (
  userEventsQueryParams: WorkforceEventQueryParams,
) => {
  const { keyword, company_id } = userEventsQueryParams;
  const _where = {};

  _where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { venue_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { short_event_location: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  if (company_id) {
    _where['company_id'] = company_id;
  }

  return _where;
};

export const getUserCompanyEventWhere = (
  userCompanyEventQueryParams: UserCompanyEventQueryParams,
  userCompanyIds: number[],
  user_id: number,
) => {
  const { company_id, assigned } = userCompanyEventQueryParams;
  const _where = {};

  _where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (company_id) {
    _where['company_id'] = company_id;
  } else {
    _where['company_id'] = { [Op.in]: userCompanyIds };
  }

  if (assigned !== undefined) {
    _where[Op.and] = [
      Sequelize.literal(`(
        SELECT EXISTS (
          SELECT 1
          FROM "event_users"
          WHERE "user_id" = ${user_id} AND "event_id" = "Event"."id"
        )
      ) = ${assigned}`),
    ];
  }

  return _where;
};

export const getEventNameSearch = async (
  keyword: string,
  user: User,
  companyIds?: number[],
  company_id?: number,
) => {
  let _where = {};

  if (companyIds?.length) {
    _where['company_id'] = { [Op.in]: companyIds };
  }

  // getting single company_id filter
  if (company_id) _where['company_id'] = company_id;

  _where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (keyword) {
    _where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  // If the logged-in user has the “Task Admin” role, only the events with the Task Module enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.TASK_ADMIN)
    _where['task_future'] = true;

  // If the logged-in user has the “Dotmap Admin” role, only the events with the Dotmap Service enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.DOTMAP_ADMIN)
    _where['dot_map_service_v2'] = true;

  _where = {
    ..._where,
    ...(await userRegionsWhere(
      user,
      false,
      false,
      company_id ? [company_id] : companyIds,
    )),
  };

  return _where;
};

export const eventNamesWhere = async (
  dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
  user: User,
  companyIds?: number[],
) => {
  const { keyword, year, region_ids } = dashboardDropdownsQueryDto;
  let where = {};

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
    year
      ? {
          [Op.and]: [
            { public_start_date: { [Op.lte]: yearEnd } },
            { public_end_date: { [Op.gte]: yearStart } },
          ],
        }
      : {},
  ];

  where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (keyword) {
    where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  if (companyIds?.length) {
    where['company_id'] = { [Op.in]: companyIds };
  }

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  // If the logged-in user has the “Task Admin” role, only the events with the Task Module enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.TASK_ADMIN)
    where['task_future'] = true;

  // If the logged-in user has the “Dotmap Admin” role, only the events with the Dotmap Service enabled will be displayed.
  if (getUserRole(user) === RolesNumberEnum.DOTMAP_ADMIN)
    where['dot_map_service_v2'] = true;

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, false, companyIds)),
  };

  return where;
};

export const eventNoteWhere = (filter_by_date: string) => {
  let where = {};

  if (filter_by_date) {
    const startOfDay = new Date(`${filter_by_date}T00:00:00.000Z`);
    const endOfDay = new Date(`${filter_by_date}T23:59:59.999Z`);

    where = {
      created_at: {
        [Op.between]: [startOfDay, endOfDay],
      },
    };
  }

  return where;
};

export const getTaskCountForSpecificUserWhere = (
  event_id: number,
  user: User,
) => {
  const _where = {};

  _where['event_id'] = event_id;

  _where['parent_id'] = null;

  if (!_where[Op.and]) _where[Op.and] = [];
  _where[Op.and].push({ ...standaloneQuery(user.id) });

  if (notUpperRole(user['role'])) {
    // For all other users except SUPER_ADMIN and ONTRACK_MANAGER, add both privacy and division lock
    _where[Op.and].push({ ...divisionRawIncludeInTask(user.id) });
  }

  return _where;
};

export const companiesCountWhere = async (
  user: User,
  companyAndSubcompaniesIds: number[],
  companyId: number,
  subCompanies?: boolean,
) => {
  let _where = {};

  if (companyId) _where['id'] = { [Op.in]: companyAndSubcompaniesIds };

  if (subCompanies) _where['parent_id'] = { [Op.ne]: null };
  else _where['parent_id'] = { [Op.eq]: null };

  _where = {
    ..._where,
    ...(await userRegionsWhere(user, false, true, companyAndSubcompaniesIds)),
  };

  return _where;
};

export const pinnedIncidentTypeWhere = (
  companyId: number,
  companyAndSubcompaniesIds: number[],
) => {
  const _where = {};

  _where['pinned'] = true;

  if (companyId) _where['company_id'] = { [Op.in]: companyAndSubcompaniesIds };

  return _where;
};
