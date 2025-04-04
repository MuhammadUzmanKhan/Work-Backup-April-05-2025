import {
  IncludeOptions,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CsvOrPdf,
  ERRORS,
  IncidentPriorityApi,
  PdfTypes,
  PusherChannels,
  PusherEvents,
  StaffRoles,
} from '@ontrack-tech-group/common/constants';
import {
  Company,
  Event,
  EventIncidentType,
  Incident,
  IncidentType,
  IncidentTypeTranslation,
  UserCompanyRole,
} from '@ontrack-tech-group/common/models';
import {
  getArrayInChunks,
  getPageAndPageSize,
  isCompanyExist,
} from '@ontrack-tech-group/common/helpers';
import {
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { formatEventCamelCaseForPdfs } from '@Common/helpers';
import {
  GetIncidentTypeIncidentsDto,
  IncidentTypeQueryParamsDto,
} from '../dto';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying incident zones.
 */
export const deleteIncidentTypeWhereQuery = (event_id: number) => {
  const _where = {};

  if (event_id) _where['id'] = { [Op.ne]: event_id };

  return _where;
};

export const getAllIncidentTypeWhere = (
  incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
  companyId: number,
) => {
  const { incident_priority, keyword, incident_priorities, date, pinned } =
    incidentTypeQueryParamsDto;
  const _where = { ...multipleIncidentPriorityFilter(incident_priorities) };

  if (incident_priority) {
    if (incident_priority === IncidentPriorityApi.MEDIUM) {
      _where['default_priority'] = {
        [Op.or]: ['normal', 'medium'],
      };
    } else {
      _where['default_priority'] = incident_priority;
    }
  }

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword}%` };
  }

  if (date) {
    const _date = new Date(date);
    _where['created_at'] = {
      [Op.between]: [
        _date.setHours(0, 0, 0, 0),
        _date.setHours(23, 59, 59, 999),
      ],
    };
  }

  if (pinned) {
    _where['pinned'] = true;
  }

  _where['company_id'] = companyId;

  return _where;
};

export const getAllIncidentTypeCountWhere = (
  incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
  companyId: number,
) => {
  const { keyword, incident_priority, incident_priorities } =
    incidentTypeQueryParamsDto;
  const _where = { ...multipleIncidentPriorityFilter(incident_priorities) };

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword}%` };
  }

  if (incident_priority) {
    if (incident_priority === IncidentPriorityApi.MEDIUM) {
      _where['default_priority'] = {
        [Op.or]: ['normal', 'medium'],
      };
    } else {
      _where['default_priority'] = incident_priority;
    }
  }
  _where['company_id'] = companyId;

  return _where;
};

export const getFilteredTypesForCsv = async (
  parsedFileData: { name: string }[],
  company_id: number,
  company_language: string,
) => {
  const uniqueFileData = Array.from(
    new Set(parsedFileData.map((item) => item.name.toLowerCase())),
  ).map((name) =>
    parsedFileData.find((item) => item.name.toLowerCase() === name),
  );

  const alreadyCreatedTypes = (
    await IncidentType.findAll({
      where: {
        company_id,
      },
      attributes: ['name'],
      include: [
        {
          model: IncidentTypeTranslation,
          as: 'incident_type_translations',
          where: {
            translation: {
              [Op.iLike]: {
                [Op.any]: uniqueFileData.map((item) => item.name.toLowerCase()),
              },
            },
            language: company_language,
          },
          attributes: ['translation'],
        },
      ],
    })
  ).map((type) => type.incident_type_translations[0].translation.toLowerCase());

  return uniqueFileData.filter(
    (type) => !alreadyCreatedTypes.includes(type.name.toLowerCase()),
  );
};

export const aphabeticalGroupData = (
  incidentTypes: any,
  alphabet_sort?: boolean,
) => {
  const specialCharacterGroup = [];
  let alphabeticalGroupData = [];

  const groupedData = incidentTypes.reduce((groups, item) => {
    const firstLetter = item.name.trim()[0].toUpperCase();

    if (!/^[A-Z]$/.test(firstLetter)) {
      specialCharacterGroup.push(item);
    } else {
      groups[firstLetter] = groups[firstLetter] || [];
      groups[firstLetter].push(item);
    }

    return groups;
  }, {});

  if (!alphabet_sort) {
    alphabeticalGroupData = Object.keys(groupedData)
      .sort() // Sort the alphabetically grouped keys
      .map((letter) => ({
        [letter]: groupedData[letter].sort(
          (a, b) => (b.is_assigned ? 1 : 0) - (a.is_assigned ? 1 : 0),
        ),
      }));
  } else {
    alphabeticalGroupData = Object.keys(groupedData)
      .sort() // Sort the alphabetically grouped keys
      .map((letter) => ({
        [letter]: groupedData[letter].sort(
          (a, b) => (b.name ? 1 : 0) - (a.name ? 1 : 0),
        ),
      }));
  }

  if (specialCharacterGroup.length > 0 && !alphabet_sort) {
    specialCharacterGroup.sort(
      (a, b) => (b.is_assigned ? 1 : -1) - (a.is_assigned ? 1 : -1),
    );
    alphabeticalGroupData.push({
      others: specialCharacterGroup,
    });
  } else if (specialCharacterGroup.length > 0) {
    alphabeticalGroupData.push({
      others: specialCharacterGroup,
    });
  }

  return alphabeticalGroupData;
};

export const convertCountArrayToPriorityCount = (counts) => {
  const priorityCounts = {
    critical: 0,
    important: 0,
    low: 0,
    medium: 0,
  };

  // need to remove this function after dash app fixed association code
  const uniqueData = removeDuplicates(counts);

  for (const item of uniqueData) {
    const priority = item.default_priority || 'medium'; // Use 'medium' if default_priority is null
    priorityCounts[priority] += item.count || 0; // Initialize count to 0 if undefined
  }

  return priorityCounts;
};

/**
 * This function generate csv as attachment or return with pdf url for global view
 */
export const generateCsvOrPdfForIncidentTypesInReport = async (
  params: IncidentTypeQueryParamsDto,
  incidentTypes: IncidentType[],
  event: Event,
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  const { csv_pdf } = params;

  // Extract the year from the event or use the current year
  const year = new Date().getFullYear().toString();

  // Construct the file name in the desired format
  const file_name = `${event.name}-${year}-IncidentsByType`;

  const _incidentTypes = incidentTypes.filter(
    (type) => type['incidents_count'],
  );

  if (csv_pdf === CsvOrPdf.CSV) {
    const formattedIncidentTypeDataForCsv =
      getFormattedIncidentTypeDataForCsv(_incidentTypes);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedIncidentTypeDataForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="incident_types.csv"');

    return res.send(response.data);
  } else if (csv_pdf === CsvOrPdf.PDF) {
    // Formatting data for pdf
    const formattedIncidentTypeDataForPdf =
      getFormattedIncidentTypeDataForPdf(_incidentTypes);

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      {
        ...formatEventCamelCaseForPdfs(event),
        incidentTypes: formattedIncidentTypeDataForPdf,
      },
      CsvOrPdf.PDF,
      PdfTypes.EVENT_INCIDENT_REPORT_INCIDENT_TYPES,
      file_name,
    );

    return res.send(response.data);
  }
};

export const getFormattedIncidentTypeDataForPdf = (
  incidentTypes: IncidentType[],
) => {
  return incidentTypes.map((incidentType) => {
    return {
      incident_type: incidentType.name,
      average_resolution_time: incidentType['resolved_avg_time'] + ' h/m Avg',
      linked_incidents: incidentType['incidents_count'],
    };
  });
};

export const getFormattedIncidentTypeDataForCsv = (
  incidentTypes: IncidentType[],
) => {
  return incidentTypes.map((incidentType) => {
    return {
      'Incident Type': incidentType.name,
      Resolution: incidentType['resolved_avg_time'] + ' h/m Avg',
      'Linked Incidents': incidentType['incidents_count'],
    };
  });
};

export const updateIncidentTypeData = async (event_id: number) => {
  const linkedIncidentType = await IncidentType.findAll({
    include: [
      {
        model: EventIncidentType,
        where: {
          incident_type_id: {
            [Op.eq]: Sequelize.literal('"IncidentType"."id"'),
          },
          event_id,
        },
      },
    ],
    attributes: ['id', 'name'],
  });

  const updatedIncidentTypeNames = linkedIncidentType.map(({ name }) => name);

  const updatedIncidentTypeIds = linkedIncidentType.map(({ id }) => id);

  const updatedIncidentType = getIncidentAlphabeticallyForSocket(
    updatedIncidentTypeNames,
    updatedIncidentTypeIds,
  );

  return updatedIncidentType;
};

export const getIncidentAlphabeticallyForSocket = (
  updatedIncidentTypeNames,
  updatedIncidentTypeIds,
) => {
  const incidentTypeKey = (name) => {
    const firstChar = name.charAt(0);
    return /^[A-Z]$/.test(firstChar) ? firstChar : 'others';
  };

  // Combine the arrays to create the desired structure
  const updatedIncidentType = updatedIncidentTypeNames.map((name, index) => ({
    key: incidentTypeKey(name),
    incident_type_id: updatedIncidentTypeIds[index],
  }));

  return updatedIncidentType;
};

// subqueries
export const incidentsCountSubquery = (
  event_id: number,
  company_id: number,
) => `(SELECT COUNT("incidents"."id")::INTEGER FROM incidents
    WHERE "incidents"."incident_type_id" = "IncidentType"."id"
    AND "incidents"."event_id" = ${event_id}
    AND "incidents"."company_id" = ${company_id})`;

export const eventsCountSubquery = (
  event_id: number,
) => `(SELECT COUNT("events"."id")::INTEGER FROM "events"
    INNER JOIN "event_incident_types" ON "events"."id" = "event_incident_types"."event_id"
    WHERE "events"."deleted_at" IS NULL
    AND "event_incident_types"."incident_type_id" = "IncidentType"."id"
    AND "events"."id" != ${event_id})`;

export const eventSubquery = (
  event_id: number,
) => `(SELECT JSON_AGG(JSON_BUILD_OBJECT(
  'id',"events"."id",
  'name',"events"."name",
  'start_date',"events"."start_date",
  'end_date', "events"."end_date")) FROM "events"
    INNER JOIN "event_incident_types" ON "events"."id" = "event_incident_types"."event_id"
    WHERE "events"."deleted_at" IS NULL
    AND "event_incident_types"."incident_type_id" = "IncidentType"."id"
    AND "events"."id" != ${event_id})`;

export const incidentTypeAlertCountSubQuery = (
  event_id: number,
) => `(SELECT COUNT ("alerts"."id")::INTEGER FROM alerts
    WHERE "IncidentType"."id" = "alerts"."alertable_id" AND "alerts"."event_id" = ${event_id} AND "alerts"."alertable_type" = 'IncidentType'
    )`;

// common attributes
export const userAttributes = [
  'id',
  'first_name',
  'last_name',
  'cell',
  'email',
  'country_code',
  'country_iso_code',
];

export const eventContactAttributes = [
  'id',
  'title',
  'contact_phone',
  'name',
  'contact_email',
  'first_name',
  'last_name',
  'contact_name',
  'country_code',
  'country_iso_code',
  'description',
];

export const getUncategorizedAttributes: any = (
  pdf_csv = false,
  event_id: number,
  company_id: number,
) => {
  const attributes = [
    'id',
    'name',
    'pinned',
    [
      Sequelize.literal(incidentsCountSubquery(event_id, company_id)),
      'incidents_count',
    ],
  ];

  if (!pdf_csv) {
    attributes.push('company_id', 'color', 'default_priority', [
      Sequelize.literal(`EXISTS (
        SELECT 1 FROM "event_incident_types"
        WHERE "event_incident_types"."incident_type_id" = "IncidentType"."id"
        AND "event_incident_types"."event_id" = ${event_id}
      )`),
      'is_assigned',
    ]);
  }

  return attributes;
};

export const getInclude = (
  is_assigned: boolean,
  event_id: number,
  language: string,
) => {
  const include = [];

  if (is_assigned) {
    include.push({
      model: EventIncidentType,
      where: {
        event_id,
        incident_type_id: {
          [Op.eq]: Sequelize.literal('"IncidentType"."id"'),
        },
      },
      attributes: [],
    });
  }

  include.push({
    model: IncidentTypeTranslation,
    as: 'incident_type_translations',
    attributes: ['id', 'language', 'translation', 'incident_type_id'],
    where: {
      language,
    },
  });

  return include;
};

export const getIncidentTypeWithResolvedTime = async (
  incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
  company_id: number,
  language: string,
  sequelize: Sequelize,
) => {
  const {
    csv_pdf,
    is_assigned,
    event_id,
    return_resolved_time,
    top_incident_types,
    page,
    page_size,
    top_sorted,
  } = incidentTypeQueryParamsDto;

  const order: any = [[Sequelize.literal('incidents_count'), 'DESC']];

  const include = getInclude(is_assigned, event_id, language);

  const [_page, _page_size] = getPageAndPageSize(page, page_size);

  const { count, rows: incidentTypes } = await IncidentType.findAndCountAll({
    where: getAllIncidentTypeWhere(incidentTypeQueryParamsDto, company_id),
    attributes: getUncategorizedAttributes(!!csv_pdf, event_id, company_id),
    include,
    order,
    limit: top_incident_types || top_sorted ? 10 : _page_size, // if top_incident_types is applied return only 10 incident types (iOS Requirement)
    offset: _page_size * _page || undefined,
    distinct: true,
  });

  const incidentTypesPlain = incidentTypes.map((type) =>
    type.get({ plain: true }),
  );

  // getting total Incident counts of Event
  const totalIncidentsOfEvent = await Incident.count({ where: { event_id } });

  // calculating percentage
  const incidentTypesWithPercentage = incidentTypesPlain.map((type) => ({
    ...type,
    percentage: Number(
      ((type['incidents_count'] / totalIncidentsOfEvent) * 100).toFixed(2),
    ),
  }));

  if (!return_resolved_time || !incidentTypes.length) {
    return { incidentType: incidentTypesWithPercentage, count };
  }

  const typeIds = incidentTypesPlain.map((type) => type.id).join(',');

  // calculating average resolved time for Incident Types
  const result = await sequelize.query(
    `SELECT * FROM get_incident_types_avg_resolved_time(${event_id}, VARIADIC ARRAY[${typeIds}])`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const resolvedTimes = result[0]['get_incident_types_avg_resolved_time'];

  const incidentTypeWithResolvedAverageTime = incidentTypesWithPercentage.map(
    (type) => ({
      ...type,
      resolved_avg_time: resolvedTimes[type.id]?.avg_resolved_time,
    }),
  );

  return { incidentType: incidentTypeWithResolvedAverageTime, count };
};

export const getIncidentTypeAlertWhere = (user_id: number) => {
  const _where = {};

  _where['alertable_type'] = 'IncidentType';
  _where['alertable_id'] = [Sequelize.literal(`"IncidentType"."id"`)];

  if (user_id) {
    _where[Op.or] = [{ user_id: user_id }, { event_contact_id: user_id }];
  }
  return _where;
};

export const getIncidentAlertWhere = (
  keyword: string,
  incident_priority?: string[],
) => {
  const _where = {};

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (incident_priority?.length) {
    _where['default_priority'] = { [Op.in]: incident_priority };
  }

  return _where;
};

export const getUserWhereQuery = (
  keyword: string,
  departmentUsers?: boolean,
  company_id?: number,
) => {
  const _where = {};
  const staffRolesArray: number[] = Object.keys(StaffRoles)
    .filter((key) => isNaN(Number(key)))
    .map((key) => StaffRoles[key]);

  if (company_id) _where['company_id'] = company_id;

  //Get role from user_company_role
  if (departmentUsers) {
    _where['$users_companies_roles.role_id$'] = { [Op.in]: staffRolesArray };
  }

  if (keyword && departmentUsers) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  } else if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { contact_phone: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { title: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { contact_email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export const EventContactAttributes = () => {
  return [
    'id',
    'title',
    'contact_phone',
    'contact_email',
    'name',
    'first_name',
    'last_name',
    'contact_name',
    'country_code',
    'country_iso_code',
    'description',
  ];
};

export const UsersAttributes = () => {
  return [
    'id',
    'first_name',
    'last_name',
    'cell',
    'email',
    'country_code',
    'country_iso_code',
  ];
};

export const multipleIncidentPriorityFilter = (incident_priorities) => {
  const _where = {};
  if (incident_priorities?.length) {
    if (typeof incident_priorities === 'string') {
      if (incident_priorities === IncidentPriorityApi.MEDIUM) {
        _where['default_priority'] = {
          [Op.in]: ['normal', 'medium'],
        };
      } else {
        _where['default_priority'] = incident_priorities;
      }
    } else if (incident_priorities?.includes(IncidentPriorityApi.MEDIUM)) {
      _where['default_priority'] = {
        [Op.or]: [
          { [Op.in]: ['normal', 'medium'] },
          { [Op.in]: incident_priorities },
        ],
      };
    } else {
      _where['default_priority'] = { [Op.in]: incident_priorities };
    }
  }
  return _where;
};

export const isIncidentTypeExist = async (
  company_id: number,
  id?: number,
  name?: string,
): Promise<IncidentType> => {
  if (!id && !name) return;

  const whereClause: WhereOptions = { company_id };
  const includeClause: IncludeOptions[] = [];

  if (id) {
    whereClause['id'] = id;
  } else {
    includeClause.push({
      model: IncidentTypeTranslation,
      as: 'incident_type_translations',
      attributes: ['id', 'incident_type_id'],
      where: { translation: name },
    });
  }

  const incidentType = await IncidentType.findOne({
    where: whereClause,
    attributes: ['id', 'name', 'company_id', 'is_test', 'default_priority'],
    include: includeClause,
  });

  if (!incidentType) {
    throw new NotFoundException(ERRORS.INCIDENT_TYPE_NOT_FOUND);
  }

  return incidentType;
};

export const sendIncidentTypesAssociationsUpdate = async (
  deletedIds: number[],
  newlyLinkedIds: number[],
  pusherService: PusherService,
  eventId: number,
  companyId: number,
  sequelize: Sequelize,
) => {
  const incidentTypes = await getIncidentTypesWithResolvedTime(
    newlyLinkedIds,
    eventId,
    companyId,
    sequelize,
  );

  const incidentTypeChunks = getArrayInChunks(incidentTypes, 20);

  if (deletedIds.length) {
    pusherService.sendDataUpdates(
      `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
      [`${PusherEvents.INCIDENT_TYPE_ASSOCIATION}`],
      { deletedIds, incidentTypes },
    );
  } else {
    for (const incidentTypes of incidentTypeChunks) {
      pusherService.sendDataUpdates(
        `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
        [`${PusherEvents.INCIDENT_TYPE_ASSOCIATION}`],
        { deletedIds, incidentTypes },
      );
    }
  }
};

export const getIncidentTypesWithResolvedTime = async (
  incidentTypeIds: number[],
  eventId: number,
  companyId: number,
  sequelize: Sequelize,
) => {
  if (!incidentTypeIds.length) return [];

  const incidentTypes = await IncidentType.findAll({
    where: { id: { [Op.in]: incidentTypeIds } },
    attributes: [
      'id',
      'name',
      'pinned',
      'company_id',
      [
        Sequelize.literal(incidentsCountSubquery(eventId, companyId)),
        'incidents_count',
      ],
    ],
  });

  return getResolvedTime(sequelize, eventId, incidentTypes);
};

export const getResolvedTime = async (
  sequelize: Sequelize,
  eventId: number,
  incidentTypes: IncidentType[],
): Promise<IncidentType[]> => {
  const incidentTypeWithResolvedAverageTime = [];

  const result = await sequelize.query(
    `SELECT * FROM get_incident_types_avg_resolved_time(${eventId}, VARIADIC ARRAY[${[
      incidentTypes.map((type) => type.id),
    ]}])`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const response = result[0]['get_incident_types_avg_resolved_time'];

  for (const _incidentType of incidentTypes) {
    const incidentType = _incidentType.get({ plain: true });

    incidentTypeWithResolvedAverageTime.push({
      ...incidentType,
      resolved_avg_time: response[incidentType.id]?.avg_resolved_time,
    });
  }

  return incidentTypeWithResolvedAverageTime;
};

export const getIncidentTypeByIdHelper = async (
  id: number,
  eventId: number,
  companyId: number,
  sequelize: Sequelize,
) => {
  const incidentType = await IncidentType.findOne({
    where: { id },
    attributes: [
      'id',
      'name',
      'company_id',
      'color',
      'default_priority',
      'pinned',
      [
        Sequelize.literal(incidentsCountSubquery(eventId, companyId)),
        'incidents_count',
      ],
      [
        Sequelize.literal(`EXISTS(
          SELECT 1 FROM "event_incident_types"
            WHERE "event_incident_types"."incident_type_id" = "IncidentType"."id"
            AND "event_incident_types"."event_id" = ${eventId}
        )`),
        'is_assigned',
      ],
    ],
  });
  if (!incidentType)
    throw new NotFoundException(ERRORS.INCIDENT_TYPE_NOT_FOUND);

  const [incidentTypeWithResolvedTime] = await getResolvedTime(
    sequelize,
    eventId,
    [incidentType],
  );

  return incidentTypeWithResolvedTime;
};

export function sendUpdatedIncidentTypes(
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

export const getIncidentTypeIncidentsWhere = (
  getIncidentTypeIncidentsDto: GetIncidentTypeIncidentsDto,
) => {
  const _where = {};
  const { incident_type_id, event_id } = getIncidentTypeIncidentsDto;

  _where['event_id'] = event_id;

  if (incident_type_id) _where['incident_type_id'] = incident_type_id;
  else _where['priority'] = 3; // Critical Priority

  return _where;
};

export const getIncidentTypeWithIncidentCountOnly = async (
  eventId: number,
  isAssigned: boolean,
  companyId: number,
  language: string,
) => {
  const include = getInclude(isAssigned, eventId, language);

  const incidentTypes = await IncidentType.findAll({
    where: { company_id: companyId },
    attributes: [
      'name',
      [
        Sequelize.literal(incidentsCountSubquery(eventId, companyId)),
        'incidents_count',
      ],
    ],
    include,
    order: [[Sequelize.literal('incidents_count'), 'DESC']],
  });

  const incidentTypesPlain = incidentTypes.map((type) =>
    type.get({ plain: true }),
  );

  return incidentTypesPlain;
};

export const getUserCompanyIncludeForAlerts = (company_id: number) => {
  const include = [];

  const staffRolesArray: number[] = Object.keys(StaffRoles)
    .filter((key) => isNaN(Number(key)))
    .map((key) => StaffRoles[key]);

  include.push({
    model: UserCompanyRole,
    where: {
      role_id: { [Op.in]: staffRolesArray },
      company_id,
    },
  });

  return include;
};

export const createIncidentTypesThroughCSV = async (
  incidentTypesToBeCreated,
  company: Company,
  event_id: number,
  transaction: Transaction,
) => {
  try {
    // No Sub incident type can be created without a core incident type
    // So if sub incident type to create first create a core of it and than sub
    // Fetch all existing parent incident types in a single query

    let createdIncidentType = [];
    let parentCompany = null;

    // fetching parent company to use its language
    if (company.parent_id)
      parentCompany = await isCompanyExist(company.parent_id);

    // if company is main company
    if (!company.parent_id) {
      //creating core incident type and its translations
      createdIncidentType = await IncidentType.bulkCreate(
        [
          ...incidentTypesToBeCreated.map((type) => ({
            name: type.name,
            company_id: company.id,
            default_priority: type.default_priority,
            incident_type_translations: {
              language: company.default_lang, // here company is already a main company
              translation: type.name,
            },
          })),
        ],
        {
          include: [{ association: 'incident_type_translations' }],
          transaction,
        },
      );
    } else {
      // if company is sub company

      // find all core incident types so we can link them with thier children
      const parentIncidentTypes = await IncidentType.findAll({
        where: {
          company_id: company.parent_id,
          parent_id: {
            [Op.is]: null,
          },
        },
        attributes: ['id', 'name'],
      });

      const subIncidentTypesToCreate = [];

      for (const incidentTypeToBeCreated of incidentTypesToBeCreated) {
        // finding core incident type to link with sub incident type checking based in name
        const parent = parentIncidentTypes.find(
          (parentIncidentType) =>
            parentIncidentType.name == incidentTypeToBeCreated.name,
        );

        if (!parent) {
          // creating sub incident types along with their parents and tranlsations
          // if core incident type do not exists already
          subIncidentTypesToCreate.push(
            IncidentType.create(
              {
                name: incidentTypeToBeCreated.name,
                company_id: company.parent_id,
                default_priority: incidentTypeToBeCreated.default_priority,
                incident_type_translations: {
                  language: parentCompany.default_lang, // core incident type must have language of core company
                  translation: incidentTypeToBeCreated.name,
                },
                variations: [
                  {
                    name: incidentTypeToBeCreated.name,
                    company_id: company.id,
                    default_priority: incidentTypeToBeCreated.default_priority,
                    incident_type_translations: {
                      language: company.default_lang, // sub incident type must have language of sub company
                      translation: incidentTypeToBeCreated.name,
                    },
                  },
                ],
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
              },
            ),
          );
        } else {
          // creating sub incident type with parent_id in it along with its translations
          // if core incident type exists already
          subIncidentTypesToCreate.push(
            IncidentType.create(
              {
                name: incidentTypeToBeCreated.name,
                company_id: company.id,
                parent_id: parent.id,
                default_priority: incidentTypeToBeCreated.default_priority,
                incident_type_translations: {
                  language: company.default_lang,
                  translation: incidentTypeToBeCreated.name,
                },
              },
              {
                include: [{ association: 'incident_type_translations' }],
                transaction,
              },
            ),
          );
        }
      }

      createdIncidentType = await Promise.all(subIncidentTypesToCreate);
    }

    await Promise.all(
      createdIncidentType.map((type) =>
        EventIncidentType.findOrCreate({
          where: {
            event_id,
            incident_type_id: type.id,
          },
          transaction,
        }),
      ),
    );

    await transaction.commit();
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    throw new InternalServerErrorException(error);
  }
};

export const getAssignedAlertSubquery = (
  table: string,
  incident_type_id: number,
) => {
  return Sequelize.literal(`
      CASE
        WHEN "${table}"."id" = ${incident_type_id} THEN true
        ELSE false
      END
    `);
};

// need to remove this function after dash app fixed association code
const removeDuplicates = (data) => {
  const uniqueKeys = new Set();
  return data.filter((item) => {
    const key = `${item['events.EventIncidentType.event_id']}-${item['events.EventIncidentType.incident_type_id']}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      return true; // Keep this item
    }
    return false; // Skip this item
  });
};
