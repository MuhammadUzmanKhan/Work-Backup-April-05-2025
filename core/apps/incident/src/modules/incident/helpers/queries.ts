import { Model, Op, Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import {
  IncidentPriorityApi,
  ScanType,
  SortBy,
  isLowerRoleIncludingOperationManager,
} from '@ontrack-tech-group/common/constants';
import {
  Comment,
  Company,
  Department,
  Event,
  Image,
  Incident,
  IncidentDivision,
  IncidentForm,
  IncidentMultipleDivision,
  IncidentType,
  IncidentZone,
  Location,
  ResolvedIncidentNote,
  Scan,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import {
  getQueryListParam,
  getUserRole,
  userRoleInclude,
} from '@ontrack-tech-group/common/helpers';
import {
  CSVDownload,
  FormattedIncidentData,
} from '@Common/constants/interfaces';
import { userScanType } from '@Common/constants';

import { IncidentQueryParamsDto } from '../dto';

import { getIncidentWhereQuery } from './where';
import { hasUnreadComments, incidentCommonAttributes } from './attributes';
import {
  getIncidentsIncludeForIdsCsv,
  getIncidentsListQueryInclude,
} from './includes';

import { dispatchStaffSerializer, getIncidentsOrder } from '.';

export const getScanType = `(CASE
  WHEN "incident_department_users->user->scans"."scan_type" IS NOT NULL THEN
    CASE
          ${Object.entries(ScanType)
            .map(
              ([, value], index) =>
                `WHEN "incident_department_users->user->scans"."scan_type" = ${index} THEN '${value}'`,
            )
            .join('\n')}
          END
  ELSE NULL
END)`;

export const getStatusNameByKeyInclude: Literal = Sequelize.literal(`(
  CASE
      WHEN "resolved_incident_note"."status" IS NOT NULL THEN
      CASE
          WHEN "resolved_incident_note"."status" = 0 THEN 'Arrest'
          WHEN "resolved_incident_note"."status" = 1 THEN 'Eviction/Ejection'
          WHEN "resolved_incident_note"."status" = 2 THEN 'Hospital Transport'
          WHEN "resolved_incident_note"."status" = 3 THEN 'Treated and Released'
          WHEN "resolved_incident_note"."status" = 4 THEN 'Resolved'
          ELSE NULL
        END
      ELSE NULL
    END
  )
`);
// This method extracts and returns relevant unique IDs from the provided incidents data.
// These IDs are plucked into separate arrays for reporters, creators, incident types, zones, forms, etc.
// The result is an object containing arrays of these unique IDs which can then be used in dependent queries.

export const getIncidentCountsByStatusAndPriority = async (
  incidentQueryParamsDto: IncidentQueryParamsDto,
  event_id: number,
  company_id: number,
  user: User,
  _priorities: IncidentPriorityApi[],
  csv: boolean,
  availableDivisionIds: number[],
  unAvailableDivisionIds: number[],
  count_status: boolean,
  reporterIds: number[],
): Promise<Incident[]> => {
  const incidents = await Incident.findAll({
    attributes: [
      'Incident.id',
      [Incident.getStatusNameByKey, 'status'],
      [Incident.getPriorityNameByKeyNewMapping, 'priority'],
    ],
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
    group: ['Incident.id', 'Incident.status', 'Incident.priority'],
    raw: true, // Return raw data for easier manipulation
    where: await getIncidentWhereQuery(
      incidentQueryParamsDto ||
        ({
          event_id,
        } as IncidentQueryParamsDto),
      company_id,
      user,
      _priorities,
      csv,
      availableDivisionIds,
      unAvailableDivisionIds,
      count_status,
    ),
  });

  return incidents;
};

export const getResolvedIncidentNoteCounts = async (
  event_id: number,
  incidentIds: number[],
): Promise<ResolvedIncidentNote[]> =>
  await ResolvedIncidentNote.findAll({
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

export const pluckRelevantIdsfromIncidentData = (
  incidents: Incident[],
): { [key: string]: number[] } => {
  // Extract unique reporter IDs from incidents where `reporter_id` is present
  const reporterIds = new Set(incidents.map((i) => i.reporter_id));
  const uniqueReporterIdsArray = Array.from(reporterIds); // Convert Set to array

  // Extract unique creator IDs from incidents where `created_by` is present
  const creatorIds = new Set(incidents.map((i) => i.created_by));
  const uniqueCreatorIdsArray = Array.from(creatorIds); // Convert Set to array

  // Extract unique incident type IDs from incidents where `incident_type_id` is present
  const incidentTypeIds = new Set(incidents.map((i) => i.incident_type_id));
  const uniqueIncidentTypeIds = Array.from(incidentTypeIds); // Convert Set to array

  // Extract unique incident zone IDs from incidents where `incident_zone_id` is present
  const incidentZoneIds = new Set(incidents.map((i) => i.incident_zone_id));
  const uniqueIncidentZoneIds = Array.from(incidentZoneIds); // Convert Set to array

  // Extract unique incident zone IDs from incidents where `incident_zone_id` is present
  const incidentDepartmentIds = new Set(
    incidents.map((i) => i.dataValues.department_id),
  );
  const uniqueIncidentDepartmentIds = Array.from(incidentDepartmentIds); // Convert Set to array

  // Extract unique incident form IDs from incidents where `incident_form_id` is present
  const incidentFormIds = new Set(
    incidents.filter((i) => i.incident_form_id).map((i) => i.incident_form_id),
  );
  const uniqueIncidentFormIds = Array.from(
    new Set(Array.from(incidentFormIds)),
  ); // Convert Set to array

  // Extract all incident IDs (no need to filter, all incidents have an `id`)
  const uniqueIncidentIds = Array.from(new Set(incidents.map((i) => i.id)));

  // Extract all parent incident IDs (some incidents may have a `parent_id`)
  const uniqueParentIncidentIds = Array.from(
    new Set(incidents.map((i) => i.parent_id)),
  );

  // Return an object containing all relevant unique IDs
  return {
    uniqueReporterIdsArray,
    uniqueCreatorIdsArray,
    uniqueIncidentTypeIds,
    uniqueIncidentZoneIds,
    uniqueIncidentFormIds,
    uniqueIncidentIds,
    uniqueParentIncidentIds,
    uniqueIncidentDepartmentIds,
  };
};

// It retrieves data such as users, resolved incidents, linked incidents, images, divisions, reporters, events, creators, etc.
// All data is fetched in parallel using Promise.all for efficiency.
export const fetchDependentDataOfIncidents = async (
  incidents: Incident[],
  company_id: number,
  event_id: number,
  user: User,
): Promise<{
  users: Incident[];
  resolved_incidents: ResolvedIncidentNote[];
  linked_incidents: Incident[];
  images: Image[];
  incident_multiple_divisions: IncidentMultipleDivision[];
  reporter: Department[];
  event: Event[];
  creators: User[];
  incident_form: IncidentForm[];
  incident_type: IncidentType[];
  location: Location[];
  incident_zone: IncidentZone[];
  hasEditAccess: Incident[];
  department: Department[];
  comments: Comment[];
  has_comment: Incident[];
}> => {
  // Extract unique relevant IDs from the incidents
  const {
    uniqueReporterIdsArray,
    uniqueCreatorIdsArray,
    uniqueIncidentTypeIds,
    uniqueIncidentZoneIds,
    uniqueIncidentFormIds,
    uniqueIncidentIds,
    uniqueParentIncidentIds,
    uniqueIncidentDepartmentIds,
  } = pluckRelevantIdsfromIncidentData(incidents);

  // Execute multiple asynchronous queries in parallel using Promise.all
  const [
    [
      users,
      resolved_incidents,
      linked_incidents,
      images,
      hasEditAccess,
      department,
      comments,
      has_comment,
    ], // Grouped related queries together
    incident_multiple_divisions,
    reporter,
    event,
    creators,
    incident_form,
    incident_type,
    location,
    incident_zone,
  ] = await Promise.all([
    // Fetch related users, resolved incidents, linked incidents, and images associated with the incidents
    Promise.all([
      Incident.findAll({
        benchmark: true,
        where: { id: uniqueIncidentIds }, // Find users associated with incident IDs
        attributes: ['id'],
        include: {
          model: User,
          as: 'users',
          through: { attributes: [] }, // Remove through-table attributes
          attributes: [
            'id',
            'name',
            'first_name',
            'last_name',
            'cell',
            'country_code',
            'email',
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
                      'scan_type', ${Scan.getScanTypeByKey},
                      'created_at', "scans"."created_at",
                      'department_id', "departments"."id",
                      'department_name', "departments"."name"
                    )
                  END AS subquery_results
                  FROM "users" AS "_users"
                  INNER JOIN "incident_department_users"
                    ON "users"."id" = "incident_department_users"."user_id"
                    AND "incident_department_users"."incident_id" = "Incident"."id"
                    AND "users"."id" = "incident_department_users"."user_id"
                  LEFT OUTER JOIN "scans"
                    ON "scans"."user_id" = "_users"."id"
                    AND "scans"."incident_id" = "Incident"."id"
                  INNER JOIN "departments"
                    ON "departments"."id" = "scans"."department_id"
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
            ...(company_id ? userRoleInclude(company_id) : []),
            {
              model: Department,
              attributes: ['id', 'name'],
              through: {
                attributes: [],
              },
            },
          ], // Conditionally include role-related data
        },
        order: [Sequelize.literal(`"users"."name" ASC`)],
      }),
      // Fetch resolved incidents
      ResolvedIncidentNote.findAll({
        benchmark: true,
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
          include: [
            'id',
            [
              Sequelize.literal(`(
            CASE
                WHEN "status" IS NOT NULL THEN
                CASE
                    WHEN "status" = 0 THEN 'arrest'
                    WHEN "status" = 1 THEN 'eviction_ejection'
                    WHEN "status" = 2 THEN 'hospital_transport'
                    WHEN "status" = 3 THEN 'treated_and_released'
                    WHEN "status" = 4 THEN 'resolved_note'
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
        where: {
          incident_id: uniqueIncidentIds, // Find resolved incidents by incident IDs
        },
      }),
      // Fetch linked incidents (parent and child relationships)
      Incident.findAll({
        benchmark: true,
        where: {
          [Op.or]: [
            { id: { [Op.in]: uniqueParentIncidentIds } }, // Parent incidents
            { parent_id: { [Op.in]: uniqueIncidentIds } }, // Child incidents
          ],
        },
      }),
      // Fetch images related to the incidents
      Image.findAll({
        benchmark: true,
        attributes: [
          'id',
          'name',
          'url',
          'createdAt',
          'thumbnail',
          'imageable_id',
          'capture_at',
          [Sequelize.col('created_by.name'), 'createdBy'],
        ],
        where: {
          imageable_id: uniqueIncidentIds, // Images associated with incident IDs
          imageable_type: 'Incident',
        },
        include: [
          {
            model: User,
            as: 'created_by',
            attributes: [],
          },
        ],
      }),
      Incident.findAll({
        benchmark: true,
        where: {
          id: uniqueIncidentIds,
        },
        include: [
          {
            model: IncidentDivision,
            as: 'incident_divisions',
            attributes: [],
          },
          {
            model: Event,
            attributes: [],
          },
          {
            model: User,
            attributes: [],
            as: 'users',
          },
        ],
        attributes: ['id', ...divisionLockEditAccess(user)],
      }),
      Department.findAll({
        benchmark: true,
        attributes: ['id', 'name'],
        where: { id: uniqueIncidentDepartmentIds },
      }),
      Comment.findAll({
        benchmark: true,
        attributes: ['id', 'commentable_id'],
        where: {
          commentable_type: 'Incident',
          commentable_id: uniqueIncidentIds,
        },
      }),
      Incident.findAll({
        benchmark: true,
        where: { id: uniqueIncidentIds }, // Find users associated with incident IDs
        attributes: [...hasUnreadComments(`"Incident"."id"`, user.id), 'id'],
      }),
    ]),
    // Fetch multiple incident divisions
    IncidentMultipleDivision.findAll({
      benchmark: true,
      attributes: ['incident_id', 'incident_division_id'],
      include: [
        {
          model: IncidentDivision, // Include incident divisions
          attributes: {
            include: [
              [
                Sequelize.cast(
                  Sequelize.col('incident_division.id'),
                  'integer',
                ),
                'id',
              ],
            ],
          },
        },
      ],
      where: {
        incident_id: uniqueIncidentIds, // Filter by incident IDs
      },
    }),
    // Fetch reporter information
    Department.findAll({
      benchmark: true,
      attributes: {
        exclude: ['is_hr_department', 'company_id', 'createdAt', 'updatedAt'],
      },
      where: {
        id: uniqueReporterIdsArray, // Filter by reporter IDs
      },
    }),
    // Fetch event details
    Event.findAll({
      where: event_id
        ? {
            id: event_id, // Filter by event ID
          }
        : company_id
          ? { company_id }
          : {},
      attributes: [
        'id',
        'time_zone',
        'name',
        [Sequelize.literal('"company"."name"'), 'company_name'],
      ],
      include: [
        {
          model: Company,
          attributes: [],
        },
      ],
      benchmark: true,
    }),
    // Fetch incident creators
    User.findAll({
      benchmark: true,
      attributes: ['id', 'name'],
      where: {
        id: uniqueCreatorIdsArray, // Filter by creator IDs
        blocked_at: { [Op.eq]: null },
      },
    }),
    // Fetch incident forms
    IncidentForm.findAll({
      benchmark: true,
      attributes: ['id', 'form_type'],
      where: {
        id: uniqueIncidentFormIds, // Filter by form IDs
      },
    }),
    // Fetch incident types
    IncidentType.findAll({
      benchmark: true,
      attributes: ['id', 'name'],
      where: {
        id: uniqueIncidentTypeIds, // Filter by incident type IDs
      },
    }),
    // Fetch location data for incidents
    Location.findAll({
      benchmark: true,
      attributes: [
        'id',
        'locationable_id',
        'latitude',
        'longitude',
        'distance',
        'eta',
        'speed',
        'battery_level',
        'event_id',
        'createdAt',
      ],
      where: {
        locationable_type: 'Incident',
        locationable_id: uniqueIncidentIds, // Location data for incidents
      },
    }),
    // Fetch incident zones
    IncidentZone.findAll({
      benchmark: true,
      attributes: [
        [Sequelize.cast(Sequelize.col('IncidentZone.id'), 'integer'), 'id'],
        'name',
        'color',
        'latitude',
        'longitude',
      ],
      where: {
        id: uniqueIncidentZoneIds, // Filter by zone IDs
      },
      include: [
        {
          model: IncidentZone,
          as: 'parent',
          attributes: [
            [Sequelize.cast(Sequelize.col('parent.id'), 'integer'), 'id'],
            'name',
            'color',
            'latitude',
            'longitude',
          ],
        },
      ],
    }),
  ]);

  // Return the collected dependent data
  return {
    users,
    resolved_incidents,
    linked_incidents,
    images,
    incident_multiple_divisions,
    reporter,
    event,
    creators,
    incident_form,
    incident_type,
    location,
    incident_zone,
    hasEditAccess,
    department,
    comments,
    has_comment,
  };
};

// This function converts an array of Sequelize model instances into plain JavaScript objects.
// It uses Sequelize's `get` method with the `{ plain: true }` option to return a simple object without metadata.
// IT RETURNS A PLAIN OBJECT OF ANY MODEL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const plainObject = (model: Model[]): any => {
  return model.map((i) => i.get({ plain: true }));
};

// IT RETURNS A PLAIN OBJECT OF ANY MODEL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userDataParser = (users: User[]): any => {
  return users.map((u: User) => ({
    ...u,
    // Ignoring TS Check and verify User relation with Department
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    department: u?.department[0],
  }));
};

// This function serializes incident data along with its related dependent data fetched from the database.
// It transforms Sequelize models into plain JavaScript objects and then maps the incidents to enrich them with related data.
export const serialiserForAllIncident = async (
  incidents: Incident[],
  company_id: number,
  event_id: number,
  user: User,
): Promise<FormattedIncidentData[]> => {
  // Fetch all dependent data needed for incidents (e.g., users, linked incidents, images, etc.)
  const {
    users,
    resolved_incidents,
    linked_incidents,
    images,
    incident_multiple_divisions,
    reporter,
    event,
    creators,
    incident_form,
    incident_type,
    location,
    incident_zone,
    hasEditAccess,
    department,
    comments,
    has_comment,
  } = await fetchDependentDataOfIncidents(
    incidents,
    company_id,
    event_id,
    user,
  );

  // Convert all Sequelize models to plain JavaScript objects for further processing
  const data = {
    incidents: plainObject(incidents),
    users: plainObject(users),
    resolved_incidents: plainObject(resolved_incidents),
    linked_incidents: plainObject(linked_incidents),
    images: plainObject(images),
    incident_multiple_divisions: plainObject(incident_multiple_divisions),
    reporter: plainObject(reporter),
    event: plainObject(event),
    creators: plainObject(creators),
    incident_form: plainObject(incident_form),
    incident_type: plainObject(incident_type),
    location: plainObject(location),
    incident_zone: plainObject(incident_zone),
    hasEditAccess: plainObject(hasEditAccess),
    department: plainObject(department),
    comments: plainObject(comments),
    has_comment: plainObject(has_comment),
  };

  // Map over the incidents and enrich each incident with its related data
  return data.incidents.map(
    (i: {
      id: number;
      incident_type_id: number;
      reporter_id: number;
      parent_id: number;
      incident_form_id: number;
      event_id: number;
      created_by: number;
      incident_zone_id: number;
      department_id: number;
    }) => ({
      ...i,
      hasEditAccess: data.hasEditAccess.find(
        (j: { id: number }) => j.id === i.id,
      )?.hasEditAccess,
      // Add incident type (name) by matching incident_type_id
      incident_type:
        data.incident_type.find(
          (j: { id: number }) => j.id === i.incident_type_id,
        )?.name || null,

      // Add reporter by matching reporter_id
      reporter:
        data.reporter.find((j: { id: number }) => j.id === i.reporter_id) ||
        null,

      // Determine if the incident has any linked incidents
      has_linked_incidents: !!data.linked_incidents.filter(
        (j: { id: number; parent_id: number }) =>
          j.id === i.parent_id || j.parent_id === i.id,
      )?.length,

      // Count how many linked incidents this incident has
      linked_incident_counts:
        data.linked_incidents.filter(
          (j: { id: number; parent_id: number }) =>
            j.id === i.parent_id || j.parent_id === i.id,
        )?.length || 0,

      // Add incident form type by matching incident_form_id
      incident_form_type:
        data.incident_form.find(
          (j: { id: number }) => j.id === i.incident_form_id,
        ) || null,

      // Add event data by matching event_id
      event:
        data.event.find((j: { id: number }) => j.id === i.event_id) || null,

      // Add creator data by matching created_by (user who created the incident)
      creator:
        data.creators.find((j: { id: number }) => j.id === i.created_by) ||
        null,

      // Attach all images related to the incident by filtering imageable_id
      images:
        data.images.filter(
          (j: { imageable_id: number }) => j.imageable_id === i.id,
        ) || [],

      // Add incident zone data by matching incident_zone_id
      incident_zone:
        data.incident_zone.find(
          (j: { id: number }) => j.id == i.incident_zone_id,
        ) || null,

      // Map divisions related to the incident by matching incident_id
      incident_divisions:
        data.incident_multiple_divisions
          .filter(
            (j: { incident_id: number; incident_division: number }) =>
              j.incident_id === i.id && j.incident_division,
          )
          .map((j: { incident_division: { id: number; name: number } }) => ({
            id: j.incident_division?.id,
            name: j.incident_division?.name,
          })) || [],

      // Add location data by matching locationable_id
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      location: (() => {
        const locationMatch =
          data.location.find(
            (j: { locationable_id: number }) => j.locationable_id == i.id,
          ) || null;
        if (locationMatch) {
          // Destructure to omit the locationable_id from the matched object
          delete locationMatch.locationable_id;

          return locationMatch;
        }
        return null;
      })(),

      // Add resolved incident note by matching incident_id
      resolved_incident_note:
        data.resolved_incidents.find(
          (j: { incident_id: number }) => j.incident_id == i.id,
        ) || null,

      // Attach users associated with this incident by matching id
      users:
        userDataParser(
          data.users
            .filter((j: { id: number }) => j.id === i.id)
            .map((j: { users: number }) => j.users)[0] || [],
        ) || [],
      department: data.department.find(
        (d: { id: number }) => d.id === i.department_id,
      ),
      comments_count: data.comments.filter(
        (comment: { commentable_id: number }) =>
          comment.commentable_id === i.id,
      ).length,
      dispatch_department_staff: userDataParser(
        dispatchStaffSerializer({
          users:
            data.users
              .filter((j: { id: number }) => j.id === i.id)
              .map((j: { users: number }) => j.users)[0] || [],
        } as Incident),
      ),
      has_unread_comments: !!data.has_comment.find(
        (comment: { has_unread_comments: boolean; id: number }) =>
          comment.id === i.id,
      ).has_unread_comments,
    }),
  );
};

export const getAllIncidentsRawQueries = (): [Literal, string][] => {
  return [
    [Sequelize.literal(`"incident_types"."name"`), 'incident_type'],
    [
      Sequelize.literal(`(
        SELECT JSON_BUILD_OBJECT(
          'id', "id",
          'name', "name",
          'staff', "staff",
          'email', "email",
          'contact_person', "contact_person",
          'phone', "phone"
        )
        FROM "departments"
        WHERE "departments"."id" = "Incident"."reporter_id"
      )`),
      'reporter',
    ],
    [Sequelize.literal(`"incident_form"."form_type"`), 'incident_form_type'],
    hasLinkedIncidents,
    linkedIncidentsCount,
  ];
};

export const orderByPrioritySequence: Literal = Sequelize.literal(`(
  CASE
      WHEN "Incident"."priority" = 3 THEN 0
      WHEN "Incident"."priority" = 2 THEN 1
      WHEN "Incident"."priority" = 1 THEN 2
      WHEN "Incident"."priority" = 0 THEN 3
    END
  )
`);

export const getIncidentStatusNameByKey: Literal = Sequelize.literal(`(
  CASE
      WHEN "Incident"."status" IS NOT NULL THEN
      CASE
          WHEN "Incident"."status" = 0 THEN 'open'
          WHEN "Incident"."status" = 1 THEN 'dispatched'
          WHEN "Incident"."status" = 2 THEN 'resolved'
          WHEN "Incident"."status" = 3 THEN 'dispatched'
          WHEN "Incident"."status" = 4 THEN 'follow_up'
          WHEN "Incident"."status" = 5 THEN 'dispatched'
          WHEN "Incident"."status" = 6 THEN 'dispatched'
          WHEN "Incident"."status" = 7 THEN 'dispatched'
          ELSE NULL
        END
      ELSE NULL
    END
  )
`);

export const getResolvedStatusNameByKey: Literal = Sequelize.literal(`(
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
  `);

export const getAllLinkedIncidentsRawQueries = (): [Literal, string][] => {
  return [
    [Sequelize.literal(`"incident_types"."name"`), 'incident_type'],
    hasLinkedIncidents,
  ];
};

export const hasLinkedIncidents: [Literal, string] = [
  Sequelize.literal(`(
    SELECT EXISTS (
      SELECT 1 FROM "incidents"
      WHERE "id" = "Incident"."parent_id" OR "parent_id" = "Incident"."id"
    )
  )`),
  'has_linked_incidents',
];

export const linkedIncidentsCount: [Literal, string] = [
  Sequelize.literal(`(
      SELECT COUNT ("incidents"."id")::INTEGER FROM incidents
      WHERE "id" = "Incident"."parent_id" OR "parent_id" = "Incident"."id"
    )`),
  'linked_incident_counts',
];

export const divisionRawInclude = (userId: number): Literal[] => [
  Sequelize.literal(`(
    "event"."division_lock_service" = FALSE OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" = ${userId}) OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" != ${userId} AND
    ("incident_divisions->user_incident_divisions"."user_id" = ${userId}
     OR "incident_divisions->IncidentMultipleDivision" IS NULL
     OR "users"."id" = ${userId})
  ))`),
];

export const divisionlockWithRestrictedVisibility = (
  userId: number,
): Literal[] => [
  Sequelize.literal(`(
    "Incident"."created_by" = ${userId} OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" != ${userId} AND
    "users"."id" = ${userId})
  )`),
];

export const divisionLockEditAccess = (user: User): [Literal, string][] => [
  [
    Sequelize.literal(`(
      CASE
      WHEN ${isLowerRoleIncludingOperationManager(getUserRole(user))} = FALSE THEN TRUE
      WHEN "event"."division_lock_service" = FALSE THEN TRUE
      WHEN "event"."division_lock_service" = TRUE AND
      (
        EXISTS (
          SELECT 1
          FROM incident_divisions AS id
          INNER JOIN user_incident_divisions AS uid ON id.id = uid.incident_division_id
          INNER JOIN incident_multiple_divisions AS imd ON imd.incident_id = "Incident"."id"
          WHERE uid.user_id = ${user.id} AND id.id = ANY(ARRAY["imd"."incident_division_id"])
        )
        OR "incident_divisions->IncidentMultipleDivision" IS NULL
        OR "users"."id" = ${user.id}
      ) THEN TRUE
      ELSE FALSE
    END
  )`),
    'hasEditAccess',
  ],
];

export const editorName: Literal = Sequelize.literal(`(
  SELECT
  CASE
    WHEN "incident_logs"."editor_type" = 'Camper' THEN (SELECT "campers"."name" FROM "campers" WHERE "campers"."id" = "incident_logs"."editor_id")
    ELSE (SELECT "users"."name" FROM "users" WHERE "users"."id" = "incident_logs"."editor_id")
  END
)`);

export const commentedBy: Literal = Sequelize.literal(`(
  SELECT
  "users"."name" FROM "users" WHERE "users"."id" = "comments"."creator_id"
)`);

export const reporter: Literal = Sequelize.literal(`(
  SELECT name
  FROM "departments"
  WHERE "departments"."id" = "Incident"."reporter_id"
)`);

export const commentedByCamper: Literal = Sequelize.literal(`(
  SELECT
  CASE
    WHEN "ChangeLog"."editor_type" = 'Camper' THEN (SELECT "campers"."name" FROM "campers" WHERE "campers"."id" = "ChangeLog"."editor_id")
    ELSE (SELECT "users"."name" FROM "users" WHERE "users"."id" = "ChangeLog"."editor_id")
  END
)`);

export const createdBy: Literal = Sequelize.literal(`(
  SELECT
  JSON_BUILD_OBJECT(
    'name',
    CASE
      WHEN "Incident"."created_by_type" = 'Camper' THEN (SELECT "campers"."name" FROM "campers" WHERE "campers"."id" = "Incident"."created_by")
      ELSE (SELECT "users"."name" FROM "users" WHERE "users"."id" = "Incident"."created_by")
    END,
    'role',
    CASE
      WHEN "Incident"."created_by_type" = 'Camper' THEN 'Camper'
      ELSE (
        CASE
          WHEN EXISTS (
            SELECT * FROM "users_companies_roles" WHERE "user_id" = "Incident"."created_by" AND "role_id" = 0
          ) THEN 'Super Admin'
          ELSE (
            CASE
              WHEN EXISTS (
                SELECT * FROM "users_companies_roles" WHERE "user_id" = "Incident"."created_by" AND "role_id" = 1 AND "company_id" = "Incident"."company_id"
              ) THEN 'Admin'
              ELSE 'Staff'
            END
          )
        END
      )
    END
  ) AS "userRole"
)`);

export const updatedBy: Literal = Sequelize.literal(`(
  SELECT
  JSON_BUILD_OBJECT(
    'name',
    CASE
      WHEN "Incident"."updated_by_type" = 'Camper' THEN (SELECT "campers"."name" FROM "campers" WHERE "campers"."id" = "Incident"."updated_by"::INTEGER)
      ELSE (SELECT "users"."name" FROM "users" WHERE "users"."id" = "Incident"."updated_by"::INTEGER)
    END,
    'role',
    CASE
      WHEN "Incident"."updated_by_type" = 'Camper' THEN 'Camper'
      ELSE (
        CASE
          WHEN EXISTS (
            SELECT * FROM "users_companies_roles" WHERE "user_id" = "Incident"."updated_by"::INTEGER AND "role_id" = 0
          ) THEN 'Super Admin'
          ELSE (
            CASE
              WHEN EXISTS (
                SELECT * FROM "users_companies_roles" WHERE "user_id" = "Incident"."updated_by"::INTEGER AND "role_id" = 1 AND "company_id" = "Incident"."company_id"
              ) THEN 'Admin'
              ELSE 'Staff'
            END
          )
        END
      )
    END
  ) AS "userRole"
)`);

export const activeIncidentsCount = (id: number, event_id: number): Literal =>
  Sequelize.literal(`(
     SELECT COUNT(DISTINCT "incidents"."id")::INT
      FROM "incidents"
      INNER JOIN "incident_department_users" ON "incidents"."id" = "incident_department_users"."incident_id"
      WHERE "incidents"."status" != 2 -- here 2 is for resolved status
      AND "incidents"."event_id" = ${event_id}
      AND "incident_department_users"."user_id" = "users"."id"
     )`);

export const incidentScans: Literal = Sequelize.literal(`(
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
)`);

export const getIncidentsLinkedData = (): [Literal, string][] => {
  return [hasLinkedIncidents, linkedIncidentsCount];
};

export const getUserLastCall = async (
  user_ids: number[],
  event_id: number,
): Promise<User[]> => {
  return await User.findAll({
    where: { id: { [Op.in]: user_ids } },
    attributes: [
      'id',
      'name',
      'first_name',
      'last_name',
      [Sequelize.literal(User.getStatusByUserKey), 'status'],
    ],
    include: [
      {
        model: Scan,
        where: { event_id, scan_type: { [Op.in]: userScanType } },
        attributes: [
          [Scan.getFormattedScanTypeByKey, 'scan_type'],
          'incident_id',
        ],
        required: false,
        order: [['createdAt', SortBy.DESC]],
        limit: 1,
      },
    ],
    plain: true,
  });
};

export const incidentLinkUnlinkSocketData = async (
  id: number,
  incident_ids: number[],
  user: User,
): Promise<Incident[]> => {
  return await Incident.findAll({
    where: { id: { [Op.in]: [id, ...incident_ids] } },
    attributes: [
      ...incidentCommonAttributes,
      ...getAllIncidentsRawQueries(),
      ...divisionLockEditAccess(user),
    ],
    include: getIncidentsListQueryInclude(),
    order: [
      Incident.orderByStatusSequence,
      Sequelize.literal(`"Incident"."created_at" ${SortBy.DESC}`),
    ],
    useMaster: true,
  });
};

export const getIncidentforCSVDownload = async (
  props: CSVDownload,
): Promise<Incident[]> => {
  const {
    incidentQueryParamsDto,
    companyId,
    user,
    availableDivisionIds,
    unAvailableDivisionIds,
    incidentDivisionIds,
    _page,
    _page_size,
  } = props;

  const { priorities, division_not_available } = incidentQueryParamsDto;
  const _priorities = getQueryListParam(priorities);

  return await Incident.findAll({
    attributes: ['id'],
    where: await getIncidentWhereQuery(
      incidentQueryParamsDto,
      companyId,
      user,
      _priorities,
      true,
      availableDivisionIds,
      unAvailableDivisionIds,
    ),
    include: getIncidentsIncludeForIdsCsv(
      incidentDivisionIds,
      division_not_available,
    ),
    subQuery: false,
    order: getIncidentsOrder(incidentQueryParamsDto, true),
    limit: _page_size || undefined,
    offset: _page_size && _page ? _page_size * _page : undefined,
    group: [`"Incident"."id"`],
  });
};
