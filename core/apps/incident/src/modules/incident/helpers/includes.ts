import { IncludeOptions, Op, Sequelize } from 'sequelize';
import {
  Alert,
  Comment,
  Company,
  Department,
  Event,
  EventContact,
  EventUser,
  Image,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentForm,
  IncidentType,
  IncidentZone,
  LegalGroup,
  Location,
  ResolvedIncidentNote,
  Scan,
  Source,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import { isWithRestrictedVisibility } from '@ontrack-tech-group/common/constants';
import {
  getUserRole,
  userRoleInclude,
} from '@ontrack-tech-group/common/helpers';

import { IncidentQueryParamsDto } from '../dto';

import { getResolvedStatusNameByKey } from './queries';

export const alertInclude = (event_id: number): IncludeOptions[] => {
  return [
    {
      model: Alert,
      attributes: ['id', 'email_alert', 'sms_alert'],
      where: { event_id },
      required: false,
      include: [
        {
          model: User,
          attributes: [
            'id',
            'cell',
            'country_code',
            'name',
            'sender_cell',
            'email',
          ],
        },
        {
          model: EventContact,
          attributes: [
            'id',
            'contact_phone',
            'country_code',
            'contact_name',
            'name',
            'contact_email',
          ],
        },
      ],
    },
  ];
};

export const getLinkedIncidentsListQueryInclude = (): IncludeOptions[] => {
  return [
    {
      model: Event,
      attributes: ['id', 'time_zone'],
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'name'],
    },
    {
      model: IncidentZone,
      attributes: [
        [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
        'name',
        'color',
      ],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [
        [Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'), 'id'],
        'name',
      ],
      include: [
        {
          model: UserIncidentDivision,
          attributes: [],
        },
      ],
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: ResolvedIncidentNote,
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
        include: [
          [
            Sequelize.cast(
              Sequelize.col('"resolved_incident_note"."id"'),
              'integer',
            ),
            'id',
          ],
          [getResolvedStatusNameByKey, 'status'],
        ],
      },
    },
    {
      model: IncidentForm,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
    },
  ];
};

export const getIncidentExistInclude = (
  location?: boolean,
): IncludeOptions[] => {
  const include: IncludeOptions[] = [
    {
      model: Event,
      attributes: [],
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
    },
  ];

  if (location) {
    include.push(
      ...([
        {
          model: IncidentZone,
          attributes: [
            [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
            'name',
          ],
          include: [
            {
              model: IncidentZone,
              attributes: ['id', 'name'],
              as: 'parent',
            },
          ],
        },
        {
          model: IncidentDivision,
          as: 'incident_divisions',
          through: { attributes: [] },
          attributes: [
            [
              Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'),
              'id',
            ],
            'name',
          ],
          include: [
            {
              model: UserIncidentDivision,
              attributes: [],
            },
          ],
        },
      ] as IncludeOptions[]),
    );
  } else {
    include.push({
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
    });
  }

  return include;
};

export const getIncidentsListQueryForMapInclude = (): IncludeOptions[] => {
  return [
    {
      model: Event,
      attributes: ['id', 'time_zone'],
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'name'],
    },
    {
      model: IncidentZone,
      attributes: [
        [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
        'name',
        'color',
        'latitude',
        'longitude',
      ],
      include: [
        {
          model: IncidentZone,
          attributes: ['id', 'name'],
          as: 'parent',
        },
      ],
    },
    {
      model: Location,
      attributes: {
        exclude: ['updatedAt', 'locationable_id', 'locationable_type'],
      },
    },
    {
      model: IncidentType,
      attributes: [],
    },
  ];
};

export const getIncidentsListQueryInclude = (
  incidentDivisionIds?: number[],
  company_id?: number,
  division_not_available?: boolean,
): IncludeOptions[] => {
  const requiredCondition =
    !!incidentDivisionIds?.length && !division_not_available;
  return [
    {
      model: Event,
      attributes: [
        'id',
        'time_zone',
        'name',
        [Sequelize.literal('"event->company"."name"'), 'company_name'],
      ],
      include: [
        {
          model: Company,
          attributes: [],
        },
      ],
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'name'],
    },
    {
      model: Image,
      attributes: [
        'id',
        'name',
        'url',
        'createdAt',
        'thumbnail',
        'capture_at',
        [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
      ],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [],
        },
      ],
    },
    {
      model: IncidentZone,
      attributes: [
        [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
        'name',
        'color',
        'latitude',
        'longitude',
      ],
      include: [
        {
          model: IncidentZone,
          attributes: ['id', 'name'],
          as: 'parent',
        },
      ],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [
        [Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'), 'id'],
        'name',
      ],
      required: requiredCondition,
    },
    {
      model: Location,
      attributes: {
        exclude: ['updatedAt', 'locationable_id', 'locationable_type'],
      },
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: IncidentForm,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [
        'id',
        'name',
        'first_name',
        'last_name',
        'cell',
        'country_code',
        company_id
          ? [
              Sequelize.literal(`"users->users_companies_roles->role"."name"`),
              'role',
            ]
          : 'email',
        [Sequelize.literal(User.getStatusByKey), 'status'],
        [
          Sequelize.literal(`(
            SELECT JSON_AGG(subquery_results)
            FROM (
              SELECT
              CASE
                WHEN "scans"."id" IS NULL THEN NULL
                ELSE JSON_BUILD_OBJECT(
                  'id', "scans"."id",
                  'scan_type', ${Scan.getScanTypeByKey},  -- Make sure this resolves correctly
                  'created_at', to_char("scans"."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                  'department_id', "departments"."id",
                  'department_name', "departments"."name"
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
      ],
      include: [
        {
          model: Location,
          attributes: ['id', 'longitude', 'latitude', 'updated_at'],
        },
        ...(company_id ? userRoleInclude(company_id) : []),
      ],
    },
    {
      model: ResolvedIncidentNote,
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
        include: [
          [
            Sequelize.cast(
              Sequelize.col('"resolved_incident_note"."id"'),
              'integer',
            ),
            'id',
          ],
          [getResolvedStatusNameByKey, 'status'],
        ],
      },
    },
    {
      model: LegalGroup,
      attributes: ['id', 'status'],
    },
  ];
};

export const getIncidentsListQueryIncludeCsv = (
  incidentDivisionIds: number[],
  division_not_available: boolean,
): IncludeOptions[] => {
  return [
    {
      model: IncidentZone,
      attributes: [
        [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
        'name',
        'is_test',
      ],
      include: [
        {
          model: IncidentZone,
          as: 'parent',
          attributes: [
            [
              Sequelize.literal(
                'CAST("incident_zone->parent"."id" AS INTEGER)',
              ),
              'id',
            ],
            'name',
            'is_test',
          ],
        },
      ],
    },
    {
      model: Source,
      attributes: ['id', 'name', 'is_test'],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [
        [Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'), 'id'],
        'name',
        'is_test',
      ],
      required: !!incidentDivisionIds?.length && !division_not_available,
    },
    {
      model: IncidentType,
      attributes: ['name', 'is_test'],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: ['id', 'name'],
    },
    {
      model: Department,
      as: 'reporter',
      attributes: [],
    },
    {
      model: Image,
      attributes: [],
    },
    {
      model: Comment,
      attributes: [],
    },
    {
      model: IncidentDepartmentUsers,
      attributes: [],
    },
    {
      model: ResolvedIncidentNote,
      attributes: [
        'id',
        [getResolvedStatusNameByKey, 'status'],
        'affected_person',
        'note',
      ],
    },
  ];
};

export const getIncidentsIncludeForIds = (
  incidentDivisionIds: number[],
  division_not_available: boolean,
): IncludeOptions[] => {
  const requiredCondition =
    !!incidentDivisionIds?.length && !division_not_available;

  return [
    {
      model: Event,
      attributes: [],
    },
    {
      model: Image,
      attributes: [],
    },
    {
      model: IncidentZone,
      attributes: [],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [],
      required: requiredCondition,
      include: [
        {
          model: UserIncidentDivision,
          attributes: [],
        },
      ],
    },
    {
      model: Location,
      attributes: [],
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: IncidentForm,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
      include: [
        { model: Department, through: { attributes: [] }, attributes: [] },
      ],
    },
  ];
};

export const getIncidentsIncludeForIdsV2 = (
  user: User,
  incidentDivisionIds?: number[],
  division_not_available?: boolean,
  params?: IncidentQueryParamsDto,
  reporterIds?: number[],
): IncludeOptions[] => {
  const requiredCondition =
    !!incidentDivisionIds?.length && !division_not_available;

  const includesForListing: IncludeOptions[] = [
    {
      model: Event,
      attributes: [],
    },
    {
      model: Image,
      attributes: [],
    },
    {
      model: IncidentZone,
      attributes: [],
    },
    {
      model: Location,
      attributes: [],
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: IncidentForm,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
      include: [
        { model: Department, through: { attributes: [] }, attributes: [] },
      ],
    },
    {
      model: ResolvedIncidentNote,
      attributes: [],
      required: false,
    },
    {
      model: LegalGroup,
      attributes: ['id', 'status'],
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
  ];

  if (
    (params && params.sort_column === 'incident_divisions') ||
    !isWithRestrictedVisibility(getUserRole(user))
  ) {
    includesForListing.push({
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [],
      required: requiredCondition,
      include: [
        {
          model: UserIncidentDivision,
          attributes: [],
        },
      ],
    });
  }

  return includesForListing;
};

export const getIncidentsIncludeForIdsV3 = (
  incidentDivisionIds: number[],
  division_not_available: boolean,
): IncludeOptions[] => {
  const requiredCondition =
    !!incidentDivisionIds?.length && !division_not_available;

  return [
    {
      model: Comment,
      attributes: [],
    },
    {
      model: Event,
      attributes: ['id', 'time_zone'],
    },
    {
      model: ResolvedIncidentNote,
      as: 'resolved_incident_note',
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
        include: [
          'id',
          [
            Sequelize.literal(`(
          CASE
              WHEN "resolved_incident_note"."status" IS NOT NULL THEN
              CASE
                  WHEN "resolved_incident_note"."status" = 0 THEN 'arrest'
                  WHEN "resolved_incident_note"."status" = 1 THEN 'eviction_ejection'
                  WHEN "resolved_incident_note"."status" = 2 THEN 'hospital_transport'
                  WHEN "resolved_incident_note"."status" = 3 THEN 'treated_and_released'
                  WHEN "resolved_incident_note"."status" = 4 THEN 'resolved_note'
                  ELSE NULL
                END
              ELSE NULL
            END
          )
        `),
            'status',
          ],
        ],
      },
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'name'],
    },
    {
      model: Image,
      attributes: [],
    },
    {
      model: IncidentZone,
      attributes: [
        [Sequelize.literal('CAST("incident_zone"."id" AS INTEGER)'), 'id'],
        'name',
        'color',
        'latitude',
        'longitude',
      ],
      include: [
        {
          model: IncidentZone,
          attributes: ['id', 'name'],
          as: 'parent',
        },
      ],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [],
      required: requiredCondition,
      include: [
        {
          model: UserIncidentDivision,
          attributes: [],
        },
      ],
    },
    {
      model: Location,
      attributes: {
        exclude: ['updatedAt', 'locationable_id', 'locationable_type'],
      },
    },
    {
      model: IncidentType,
      attributes: [],
    },
    {
      model: IncidentForm,
      attributes: [],
    },
    {
      model: Department,
      as: 'reporter',
      attributes: {
        exclude: ['is_hr_department', 'company_id', 'createdAt', 'updatedAt'],
      },
    },
    {
      model: Department,
      as: 'department',
      attributes: ['id', 'name'],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
      include: [
        { model: Department, through: { attributes: [] }, attributes: [] },
      ],
    },
  ];
};

export const getIncidentsIncludeForIdsCsv = (
  incidentDivisionIds: number[],
  division_not_available: boolean,
): IncludeOptions[] => {
  return [
    {
      model: IncidentZone,
      attributes: [],
      include: [
        {
          model: IncidentZone,
          as: 'parent',
          attributes: [],
        },
      ],
    },
    {
      model: Source,
      required: false,
      attributes: [],
    },
    {
      model: IncidentDivision,
      as: 'incident_divisions',
      through: { attributes: [] },
      attributes: [],
      required: !!incidentDivisionIds?.length && !division_not_available,
    },
    {
      model: IncidentType,
      required: false,
      attributes: [],
    },
    {
      model: User,
      as: 'users',
      through: { attributes: [] },
      attributes: [],
    },
  ];
};

export const EventUserModel = (user_id: number): IncludeOptions => {
  return {
    model: EventUser,
    attributes: [],
    where: { user_id },
    required: true,
  };
};
