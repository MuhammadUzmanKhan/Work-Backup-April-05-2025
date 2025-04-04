import { Op, Sequelize, WhereOptions } from 'sequelize';
import * as _ from 'lodash';
import {
  DispatchedStatusFilter,
  ImageOrComment,
  IncidentDispatch,
  IncidentPriorityApi,
  IncidentStatusFilter,
  IncidentStatusType,
  isLowerRoleIncludingOperationManager,
  isWithRestrictedVisibility,
  PolymorphicType,
  ResolvedIncidentNoteStatusApi,
  ResolvedIncidentNoteStatusDb,
  ResolvedNotesStatus,
  SourceType,
  StatusFilter,
  WhereClause,
} from '@ontrack-tech-group/common/constants';
import { ResolvedIncidentNote, User } from '@ontrack-tech-group/common/models';
import {
  getQueryListParam,
  getUserRole,
} from '@ontrack-tech-group/common/helpers';

import {
  GetDispatchLogsDto,
  IncidentChangelogQueryParamsDto,
  IncidentOverviewStatsQueryParamsDto,
  IncidentQueryParamsDto,
} from '../dto';

import {
  divisionlockWithRestrictedVisibility,
  divisionRawInclude,
} from './queries';

import {
  availableDivisionIncidentIds,
  csvToArrayParser,
  unAvailableDivisionIncidentIds,
} from '.';

export const getIncidentsForMapWhereQuery = (
  event_id: number,
  user: User,
  company_id?: number,
): WhereOptions => {
  const where: WhereClause = {};

  if (event_id) where['event_id'] = event_id;
  if (company_id) where['company_id'] = company_id;
  if (user && isLowerRoleIncludingOperationManager(getUserRole(user))) {
    if (!where[Op.and]) where[Op.and] = [];

    if (isWithRestrictedVisibility(getUserRole(user))) {
      // for roles which can only see their logged incidents and those which are dispatched to these roles.
      (where[Op.and] as WhereOptions[]).push({
        ...divisionlockWithRestrictedVisibility(user.id),
      });
    } else {
      // for roles which follow division lock logic but not restricted.
      (where[Op.and] as WhereOptions[]).push({
        ...divisionRawInclude(user.id),
      });
    }
  }
  return where as WhereOptions;
};

export const getIncidentWhereQuery = async (
  filters: IncidentQueryParamsDto,
  company_id: number,
  user: User,
  priorities: IncidentPriorityApi[],
  csv = false,
  availableDivisionIds?: number[],
  unAvailableDivisionIds?: number[],
  count_status = false,
  incidentIds?: number[],
  linkedIncidentIds?: number[],
  companyIds?: number[],
): Promise<WhereOptions> => {
  const _where: WhereClause = {};

  const {
    event_id,
    department_id,
    keyword,
    date,
    inventory_id,
    incident_zone_id,
    source_id,
    created_by_id,
    status,
    dispatched_status,
    has_image_or_comment,
    source_type,
    incident_type_id,
    dispatched_to_user_id,
    incident_dispatch,
    location_logged,
    all_statuses,
    resolved_status,
    end_date,
    start_date,
    reporting,
    multiple_incident_type_filter, // for iOS API
    multiple_priorities_filter, // for iOS API
    zone_ids, // for iOS API
    multiple_statuses_filter, // for iOS API
    created_or_dispatched_by_current_user, // for iOS API
    type_filter, // for iOS API
    is_legal,
    is_archived,
    is_concluded,
  } = filters;

  let resolvedIncidentsIds: number[] = [];
  //Added logic for adding status filter in count api and resolve status in get api
  let resolveStatusMapper!: IncidentStatusFilter[];
  let validDispatchedStatus!: boolean;
  let resolveStatusForMultipleStatus: string[] = []; //Adding this to store resolve status in multiple_statuses_filter

  // Check if dispatched status is valid when count_status is true
  if (count_status) {
    validDispatchedStatus = getQueryListParam(status)?.every(
      (item: DispatchedStatusFilter) =>
        Object.values(DispatchedStatusFilter).includes(
          item as DispatchedStatusFilter,
        ),
    );
  }

  const validResolvedStatus = getQueryListParam(status)?.every(
    (item: ResolvedIncidentNoteStatusApi) =>
      Object?.values(ResolvedIncidentNoteStatusApi)?.includes(
        item as ResolvedIncidentNoteStatusApi,
      ),
  );

  if (validResolvedStatus) resolveStatusMapper = status;

  // Exclude linked incidents if linkedIncidentIds is provided
  if (linkedIncidentIds) {
    _where['id'] = {
      [Op.notIn]: linkedIncidentIds,
    };
  }

  // for iOS API
  if (
    created_or_dispatched_by_current_user &&
    (dispatched_to_user_id || created_by_id)
  ) {
    _where[Op.or] = [
      { '$users.id$': dispatched_to_user_id || created_by_id },
      { created_by: created_by_id || dispatched_to_user_id },
    ];
  }

  // Ensure '_where' filters are applied correctly
  if (is_legal || is_archived !== undefined || is_concluded !== undefined) {
    _where['is_legal'] = true; // 'is_legal' must always be true for archived or concluded incidents
  }

  // Apply specific filters
  if (is_legal !== undefined) {
    _where['is_legal'] = is_legal; // Handles the 'is_legal' filter explicitly
  }

  if (is_archived !== undefined) {
    _where['is_archived'] = is_archived; // Adds the 'is_archived' filter
  }

  if (is_concluded !== undefined) {
    _where['is_concluded'] = is_concluded; // Adds the 'is_concluded' filter
  }

  if (company_id) _where['company_id'] = company_id;
  else if (companyIds?.length) _where['company_id'] = companyIds;

  if (event_id) _where['event_id'] = event_id;

  if (inventory_id) _where['inventory_id'] = inventory_id;

  if (incident_zone_id) {
    _where['incident_zone_id'] = {
      [Op.in]: getQueryListParam(incident_zone_id),
    };
  } else if (zone_ids) {
    const parsedZoneIds = csvToArrayParser(zone_ids);
    _where['incident_zone_id'] = {
      [Op.in]: parsedZoneIds,
    };
  }

  if (source_id) _where['source_id'] = source_id;

  if (department_id) _where['reporter_id'] = department_id;

  if (created_by_id && !created_or_dispatched_by_current_user) {
    _where['created_by'] = created_by_id;
  }

  // for iOS API
  if (multiple_statuses_filter) {
    const statuses = csvToArrayParser(multiple_statuses_filter) as string[];

    // seprate resolve status from other status to run query
    const seprateArrays = seprateStatusFromResolvedStatus(statuses);

    resolveStatusForMultipleStatus = seprateArrays?.resolvedStatus;

    //other status like follow_up, dispatch, open etc
    const statusesArray = seprateArrays?.statusesArray;

    const statusValues = statusesArray.map((status: string) =>
      Object.values(StatusFilter).indexOf(status as StatusFilter),
    );

    // if resolve notes status come in multiple status filter then this query will run
    if (resolveStatusForMultipleStatus?.length) {
      const resolvedStatusArray = resolveStatusForMultipleStatus.map(
        (status: string) =>
          Object.values(ResolvedNotesStatus).indexOf(
            status as ResolvedNotesStatus,
          ),
      );

      _where[Op.or] = [
        {
          '$resolved_incident_note.status$': {
            [Op.in]: resolvedStatusArray,
          },
        },
        {
          status: {
            [Op.in]: statusValues,
          },
        },
      ];
    } else {
      _where['status'] = {
        [Op.in]: statusValues,
      };
    }
  }

  // This condition evaluates the following cases to determine if the block should execute:
  // 1. Case: If `count_status`, `validResolvedStatus`, and `validDispatchedStatus` are all false.
  // 2. Case: If both `validResolvedStatus` and `validDispatchedStatus` are true, regardless of `count_status`.
  // 3. Case: If `count_status` is true and at least one of `validResolvedStatus` or `validDispatchedStatus` is true.
  //
  // The block will not execute if:
  // - Only `count_status` is true.
  // - Only one of `validResolvedStatus` or `validDispatchedStatus` is true while `count_status` is false.
  if (
    !count_status ||
    (validResolvedStatus && validDispatchedStatus) ||
    (count_status && (validResolvedStatus || validDispatchedStatus))
  ) {
    const statuses = getQueryListParam(status);
    const dispatched_statuses = getQueryListParam(dispatched_status);
    if (
      !count_status &&
      !reporting &&
      statuses?.includes(IncidentStatusFilter.DISPATCHED_ONLY)
    ) {
      const updatedStatuses = statuses.map((newStatus: string) =>
        newStatus === 'dispatched_only' ? 'dispatched' : newStatus,
      );

      _where['status'] = {
        [Op.in]: [
          ...updatedStatuses.map((status: string) =>
            Object.values(StatusFilter).indexOf(status as StatusFilter),
          ),
        ],
      }; // For showing only dispatched data in listing
    } else if (!reporting && statuses?.[0] === StatusFilter.DISPATCHED) {
      _where['status'] = {
        [Op.in]: [
          IncidentStatusType.DISPATCHED,
          IncidentStatusType.RESPONDING,
          IncidentStatusType.AT_SCENE,
          IncidentStatusType.IN_ROUTE,
          IncidentStatusType.ARCHIVED,
        ],
      }; // Filtering status on codition when resolve status are not in list
    } else if (
      !validResolvedStatus &&
      !count_status &&
      !statuses?.includes(IncidentStatusFilter.RESOLVED_ONLY) &&
      (status || dispatched_status)
    ) {
      _where['status'] = {
        [Op.in]: [...(statuses || []), ...(dispatched_statuses || [])].map(
          (status) => Object.values(StatusFilter).indexOf(status),
        ),
      };
    } else if (statuses?.includes(IncidentStatusFilter.RESOLVED_ONLY)) {
      // filter to fetch only resolved status not includeing resolve notes data
      _where['status'] = IncidentStatusType.RESOLVED;
      if (statuses?.length === 1) {
        _where['$resolved_incident_note.id$'] = null;
      } else {
        const resolve_status = statuses.filter(
          (_status: string) => _status !== IncidentStatusFilter.RESOLVED_ONLY,
        );
        _where[Op.or] = [
          {
            '$resolved_incident_note.status$': {
              [Op.in]: [...resolve_status].map((status) =>
                Object.values(ResolvedNotesStatus).indexOf(status),
              ),
            },
          },
          { '$resolved_incident_note.id$': null },
        ];
      }
    } else if (
      !status &&
      !all_statuses &&
      !resolved_status &&
      !resolveStatusMapper &&
      !resolveStatusForMultipleStatus?.length &&
      !multiple_statuses_filter &&
      !keyword
    ) {
      _where['status'] = {
        [Op.notIn]: [IncidentStatusType.FOLLOW_UP, IncidentStatusType.RESOLVED],
      };
    }
  }

  // Handle date range filtering
  if (date) {
    const _date = new Date(date);
    const startDate = new Date(_date.setHours(0, 0, 0, 0));
    const endDate = end_date
      ? new Date(new Date(end_date).setHours(23, 59, 59, 999))
      : new Date(_date.setHours(23, 59, 59, 999));

    _where[Op.and] = [dateWhereClause(startDate, endDate)];
  }

  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    _where[Op.and] = [dateWhereClause(startDate, endDate)];
  }

  if (source_type === SourceType.FE) {
    _where['source_type'] = {
      [Op.or]: {
        [Op.eq]: Object.values(SourceType).indexOf(source_type),
        [Op.is]: null,
      },
    };
  } else if (source_type) {
    _where['source_type'] = Object.values(SourceType).indexOf(source_type);
  }

  if (priorities?.length) {
    const multiplePriorities = priorities.map((priority) =>
      Object.values(IncidentPriorityApi).indexOf(priority),
    );
    _where['priority'] = { [Op.in]: multiplePriorities };
  }

  // for iOS API
  if (multiple_priorities_filter && !count_status) {
    const parsedPriorities: string[] = csvToArrayParser(
      multiple_priorities_filter,
    ) as string[];
    const multiplePriorities: number[] = parsedPriorities.map(
      (priority: string) =>
        Object.values(IncidentPriorityApi).indexOf(
          priority as IncidentPriorityApi,
        ),
    );

    _where['priority'] = { [Op.in]: multiplePriorities };
  }

  // Get ids from resolved incident notes table based on sub-statuses of resolved status
  if (!count_status && (resolved_status || resolveStatusMapper)) {
    resolvedIncidentsIds = (
      await ResolvedIncidentNote.findAll({
        where: {
          event_id,
          status: {
            [Op.in]: getQueryListParam(
              resolved_status || resolveStatusMapper,
            ).map(
              (status: keyof typeof ResolvedIncidentNoteStatusDb) =>
                ResolvedIncidentNoteStatusDb[
                  status.toUpperCase() as keyof typeof ResolvedIncidentNoteStatusDb
                ],
            ),
          },
        },
        attributes: ['incident_id'],
      })
    ).map((resolvedNote) => resolvedNote.incident_id);

    _where['id'] = { [Op.in]: resolvedIncidentsIds };
  }

  const incidentIdsOfDivisionAndNaDivisions = [
    ...(availableDivisionIds || []),
    ...(unAvailableDivisionIds || []),
  ];

  if (
    unAvailableDivisionIds?.length ||
    availableDivisionIds?.length ||
    incidentIds?.length
  ) {
    // Find common incident IDs
    let commonIncidentIds = incidentIdsOfDivisionAndNaDivisions;

    if (resolvedIncidentsIds?.length) {
      commonIncidentIds = _.intersection(
        resolvedIncidentsIds,
        incidentIdsOfDivisionAndNaDivisions,
      );
    }

    _where['id'] = {
      [Op.in]: commonIncidentIds,
    };
  }

  if (incident_type_id)
    _where['incident_type_id'] = {
      [Op.in]: getQueryListParam(incident_type_id),
    };

  if (multiple_incident_type_filter) {
    _where['incident_type_id'] = {
      [Op.in]: csvToArrayParser(multiple_incident_type_filter),
    };
  }

  if (dispatched_to_user_id && !created_or_dispatched_by_current_user) {
    _where['$users.id$'] = dispatched_to_user_id;
  }
  if (incident_dispatch === IncidentDispatch.DISPATCHED) {
    _where['status'] = Object.values(StatusFilter).indexOf(
      StatusFilter.DISPATCHED,
    );
  } else if (
    incident_dispatch === IncidentDispatch.NOT_DISPATCHED &&
    !resolveStatusForMultipleStatus?.length
  ) {
    _where['status'] = {
      [Op.and]: {
        [Op.ne]: Object.values(StatusFilter).indexOf(StatusFilter.DISPATCHED),
        [Op.notIn]: [
          Object.values(StatusFilter).indexOf(StatusFilter.FOLLOW_UP),
          Object.values(StatusFilter).indexOf(StatusFilter.RESOLVED),
        ],
      },
    };
  }

  if (location_logged) {
    _where['incident_zone_id'] = null;
  }

  // for iOS API
  if (type_filter) {
    _where['$incident_types.name$'] = {
      [Op.iLike]: `%${type_filter.toLowerCase()}%`,
    };
  }

  if (keyword) {
    const keywordCondition: WhereOptions[] = [
      { incident_type: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { locator_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      Sequelize.literal(
        `CAST("Incident"."id" AS TEXT) ILIKE '%${keyword.toLowerCase()}%'`,
      ),
    ];

    keywordCondition.push({
      '$users.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` },
    });

    _where[Op.or] = keywordCondition;
  }

  switch (has_image_or_comment) {
    case ImageOrComment.HAS_COMMENT:
      _where['has_comment'] = true;
      break;

    case ImageOrComment.HAS_IMAGE:
      _where['has_image'] = true;
      break;

    case ImageOrComment.HAS_BOTH:
      _where['has_comment'] = true;
      _where['has_image'] = true;
      break;
  }

  if (user && isLowerRoleIncludingOperationManager(getUserRole(user))) {
    if (!_where[Op.and]) _where[Op.and] = [];

    if (isWithRestrictedVisibility(getUserRole(user))) {
      // for roles which can only see their logged incidents and those which are dispatched to these roles.
      (_where[Op.and] as WhereOptions[]).push({
        ...divisionlockWithRestrictedVisibility(user.id),
      });
    } else {
      // for roles which follow division lock logic but not restricted.
      (_where[Op.and] as WhereOptions[]).push({
        ...divisionRawInclude(user.id),
      });
    }
  }

  if (csv) {
    // Ensure _where[Op.and] is always an array
    if (_where[Op.and] && !Array.isArray(_where[Op.and])) {
      _where[Op.and] = [_where[Op.and]];
    } else if (!_where[Op.and]) {
      _where[Op.and] = [];
    }

    (_where[Op.and] as WhereOptions[]).push(
      Sequelize.and(
        Sequelize.literal(
          `("source"."id" IS NULL OR "source"."is_test" = false)`,
        ),
        Sequelize.literal(`
        NOT EXISTS (
          SELECT 1
          FROM "incident_multiple_divisions" AS imd
          JOIN "incident_divisions" AS id ON imd."incident_division_id" = id."id"
          WHERE imd."incident_id" = "Incident"."id"
            AND id."is_test" = true
        )
      `),
        Sequelize.literal(
          `("incident_types"."id" IS NULL OR "incident_types"."is_test" = false)`,
        ),
        Sequelize.literal(
          `("incident_zone"."id" IS NULL OR "incident_zone"."is_test" = false)`,
        ),
        Sequelize.literal(
          `("incident_zone->parent"."id" IS NULL OR "incident_zone->parent"."is_test" = false)`,
        ),
      ),
    );
  }

  return _where;
};

// incidentDashboardStatsWhereQuery this method maintains Where clause for "incidentDashboardStats" method
export const incidentDashboardStatsWhereQuery = async (
  incidentStatsQueryDto: IncidentOverviewStatsQueryParamsDto,
): Promise<WhereOptions> => {
  const _where: WhereClause = {};

  const {
    event_id,
    priority,
    status,
    date,
    incident_type_id,
    incident_zone_id,
    incident_division_ids,
    keyword,
    has_image_or_comment,
    location_logged,
    multiple_statuses_filter,
    multiple_incident_type_filter,
    division_not_available,
    multiple_priorities_filter,
    zone_ids,
  } = incidentStatsQueryDto;

  _where['event_id'] = event_id;
  let unAvailableDivisionIds!: number[];
  let incidentIds!: number[];

  if (priority) {
    const priorityIndex = Object.values(IncidentPriorityApi).findIndex(
      (i) => i === priority,
    );
    _where['priority'] = priorityIndex;
  }

  if (incident_type_id) _where['incident_type_id'] = incident_type_id;

  if (status) {
    const statuses: StatusFilter[] = getQueryListParam(status);
    if (statuses?.[0] === StatusFilter.DISPATCHED) {
      _where['status'] = {
        [Op.in]: [
          IncidentStatusType.DISPATCHED,
          IncidentStatusType.RESPONDING,
          IncidentStatusType.AT_SCENE,
          IncidentStatusType.IN_ROUTE,
          IncidentStatusType.ARCHIVED,
        ],
      };
    } else {
      _where['status'] = {
        [Op.in]: statuses.map((status: StatusFilter) =>
          Object.values(StatusFilter).indexOf(status),
        ),
      };
    }
  }

  if (incident_division_ids?.length)
    _where[Op.and] = Sequelize.literal(
      `"Incident"."id" IN (SELECT "incident_id" FROM "incident_multiple_divisions" WHERE "incident_division_id" IN (${incident_division_ids}))`,
    );

  if (keyword) {
    _where[Op.or] = [
      { incident_type: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { locator_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      Sequelize.literal(
        `CAST("Incident"."id" AS TEXT) ILIKE '%${keyword.toLowerCase()}%'`,
      ),
      { '$users.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  switch (has_image_or_comment) {
    case ImageOrComment.HAS_COMMENT:
      _where['has_comment'] = true;
      break;

    case ImageOrComment.HAS_IMAGE:
      _where['has_image'] = true;
      break;

    case ImageOrComment.HAS_BOTH:
      _where['has_comment'] = true;
      _where['has_image'] = true;
      break;
  }

  if (date) {
    const _date = new Date(date);
    _where['logged_date_time'] = {
      [Op.between]: [
        _date.setHours(0, 0, 0, 0),
        _date.setHours(23, 59, 59, 999),
      ],
    };
  }

  if (location_logged) {
    _where['incident_zone_id'] = null;
  }

  if (unAvailableDivisionIds) {
    _where['id'] = {
      [Op.in]: unAvailableDivisionIds,
    };
  }

  if (multiple_statuses_filter) {
    const statuses = csvToArrayParser(multiple_statuses_filter) as string[];

    // seprate resolve status from other status to run query
    const seprateArrays = seprateStatusFromResolvedStatus(statuses);

    const resolveStatusForMultipleStatus = seprateArrays?.resolvedStatus;

    //other status like follow_up, dispatch, open etc
    const statusesArray = seprateArrays?.statusesArray;

    // Map over statuses, ensuring proper casting to keyof typeof StatusFilter
    const statusValues = statusesArray.map((status: string) =>
      Object.values(StatusFilter).indexOf(status as StatusFilter),
    );

    if (statusesArray?.includes(StatusFilter.DISPATCHED)) {
      statusValues.push(
        IncidentStatusType.RESPONDING,
        IncidentStatusType.AT_SCENE,
        IncidentStatusType.IN_ROUTE,
        IncidentStatusType.ARCHIVED,
      );
    }
    // if resolve notes status come in multiple status filter then this query will run
    if (resolveStatusForMultipleStatus?.length) {
      const resolvedStatusArray = resolveStatusForMultipleStatus.map(
        (status: string) =>
          Object.values(ResolvedNotesStatus).indexOf(
            status as ResolvedNotesStatus,
          ),
      );

      _where[Op.or] = [
        {
          '$resolved_incident_note.status$': {
            [Op.in]: resolvedStatusArray,
          },
        },
        {
          status: {
            [Op.in]: statusValues,
          },
        },
      ];
    } else {
      _where['status'] = {
        [Op.in]: statusValues,
      };
    }
  }

  if (multiple_incident_type_filter) {
    _where['incident_type_id'] = {
      [Op.in]: csvToArrayParser(multiple_incident_type_filter),
    };
  }

  if (division_not_available) {
    unAvailableDivisionIds = await unAvailableDivisionIncidentIds(event_id);
  }

  // Fetch available division IDs if multiple_divisions_filter is provided
  if (incident_division_ids) {
    const incidentDivisionIds = getQueryListParam(incident_division_ids);

    incidentIds = await availableDivisionIncidentIds(incidentDivisionIds);
  }

  if (incident_division_ids || division_not_available) {
    const incidentIdsOfDivisionAndNaDivisions = [
      ...(incidentIds || []),
      ...(unAvailableDivisionIds || []),
    ];

    const commonIncidentIds = _.intersection(
      incidentIdsOfDivisionAndNaDivisions,
    );

    _where['id'] = {
      [Op.in]: commonIncidentIds,
    };
  }

  if (multiple_priorities_filter) {
    const parsedPriorities: string[] = csvToArrayParser(
      multiple_priorities_filter,
    ) as string[];
    const multiplePriorities: number[] = parsedPriorities.map(
      (priority: string) =>
        Object.values(IncidentPriorityApi).indexOf(
          priority as IncidentPriorityApi,
        ),
    );

    _where['priority'] = { [Op.in]: multiplePriorities };
  }

  if (incident_zone_id) {
    _where['incident_zone_id'] = {
      [Op.in]: getQueryListParam(incident_zone_id),
    };
  } else if (zone_ids) {
    const parsedZoneIds = csvToArrayParser(zone_ids);
    _where['incident_zone_id'] = {
      [Op.in]: parsedZoneIds,
    };
  }

  return _where;
};

export const incidentChangeLogWhere = (
  id: number,
  incidentChangelogQueryParamsDto: IncidentChangelogQueryParamsDto,
): WhereOptions => {
  const { keyword, change_column } = incidentChangelogQueryParamsDto;

  const where: WhereClause = {
    change_logable_id: id,
    change_logable_type: PolymorphicType.INCIDENT,
  };

  if (keyword) {
    where['formatted_log_text'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (change_column) {
    where['column'] = change_column;
  }

  return where;
};

export const getDispatchLogsWhere = (
  getDispatchLogsDto: GetDispatchLogsDto,
): WhereOptions => {
  const { keyword } = getDispatchLogsDto;
  const where: WhereClause = {};

  if (keyword) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { last_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }
  return where;
};

export const getEventNameSearch = async (
  keyword: string,
  company_id: number,
): Promise<WhereOptions> => {
  const _where: WhereClause = {};

  if (keyword) {
    _where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  _where['company_id'] = company_id;

  return _where;
};

const dateWhereClause = (startDate: Date, endDate: Date): WhereClause => {
  return {
    [Op.or]: [
      {
        // Only apply to logged_date_time if it has a value
        logged_date_time: {
          [Op.between]: [startDate, endDate],
          [Op.ne]: null,
        },
      },
      {
        // Apply to created_at only if logged_date_time is null
        logged_date_time: null,
        created_at: { [Op.between]: [startDate, endDate] },
      },
    ],
  };
};

export const getMobileCountWhere = async (
  user: User,
  event_id: number,
  company_id: number,
  created_or_dispatched_by_current_user: boolean,
): Promise<WhereOptions> => {
  const _where: WhereClause = {};

  _where['event_id'] = event_id;
  _where['company_id'] = company_id;

  if (created_or_dispatched_by_current_user) {
    _where[Op.and] = [
      {
        [Op.or]: [{ '$users.id$': user.id }, { created_by: user.id }],
      },
    ];
  }

  if (user && isLowerRoleIncludingOperationManager(getUserRole(user))) {
    if (!_where[Op.and]) _where[Op.and] = [];

    if (isWithRestrictedVisibility(getUserRole(user))) {
      // for roles which can only see their logged incidents and those which are dispatched to these roles.
      (_where[Op.and] as WhereOptions[]).push({
        ...divisionlockWithRestrictedVisibility(user.id),
      });
    } else {
      // for roles which follow division lock logic but not restricted.
      (_where[Op.and] as WhereOptions[]).push({
        ...divisionRawInclude(user.id),
      });
    }
  }

  return _where;
};

//to seprate arrays for resolved status and status in incident table
const seprateStatusFromResolvedStatus = (
  statuses: string[],
): {
  resolvedStatus: string[];
  statusesArray: string[];
} => {
  const resolvedNotesStatusValues = new Set<string>(
    Object.values(ResolvedNotesStatus),
  );

  const resolvedStatus: string[] = [];
  const statusesArray: string[] = [];

  for (const status of statuses) {
    const trimmedStatus = status.trim();
    if (resolvedNotesStatusValues.has(trimmedStatus)) {
      resolvedStatus.push(trimmedStatus); // Add to resolved statuses
    } else {
      statusesArray.push(trimmedStatus); // Add to other statuses
    }
  }

  return { resolvedStatus, statusesArray };
};
