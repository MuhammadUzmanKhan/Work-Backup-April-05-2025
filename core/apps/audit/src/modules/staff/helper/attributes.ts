import { FindAttributeOptions, Sequelize } from 'sequelize';

const shiftCurrentBaseAttributes: FindAttributeOptions = [
  [
    Sequelize.literal(`
    COALESCE(SUM(
      CASE
        WHEN "AuditStaff"."checked_in" IS NOT NULL THEN
          CASE
            WHEN "AuditStaff"."checked_out" IS NULL AND
                "AuditStaff"."checked_in" + INTERVAL '24 hours' > NOW()
              THEN EXTRACT(EPOCH FROM (NOW() - "AuditStaff"."checked_in")) / 3600 * "AuditStaff"."rate"
            WHEN "AuditStaff"."checked_out" IS NULL
              THEN EXTRACT(EPOCH FROM ("shift"."end_date" - "AuditStaff"."checked_in")) / 3600 * "AuditStaff"."rate"
            ELSE
              EXTRACT(EPOCH FROM ("AuditStaff"."checked_out" - "AuditStaff"."checked_in")) / 3600 * "AuditStaff"."rate"
          END
      END
    ), 0)
  `),
    'currentRate',
  ],
];

export const orderedVsDeliveredAttributes: FindAttributeOptions = [
  [
    Sequelize.literal(
      'SUM(EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate")',
    ),
    'totalRate',
  ],
  ...shiftCurrentBaseAttributes,
];

export const staffCountForEachShiftTotalAttributes = (
  event_id: number,
): FindAttributeOptions => [
  [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'totalCheckedInCount',
  ],
  [
    Sequelize.literal(
      `CAST(
        (COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::FLOAT / COUNT("vendor_position"."id")::FLOAT) * 100 AS NUMERIC(10, 2)
      )::FLOAT`,
    ),
    'checkedInPercentage',
  ],
  [
    Sequelize.literal(
      'SUM(EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate")',
    ),
    'totalRate',
  ],
  [
    Sequelize.literal(`(
        SELECT JSON_AGG(subquery_counts)
        FROM
          (SELECT
            COUNT("AuditStaff"."id")::INT AS "totalCount",
            COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT AS "totalCheckedInCount",
            "vendor"."name" AS "vendorName"
          FROM "audit"."staff" AS "AuditStaff"
          INNER JOIN "audit"."shifts" AS "_shift" ON "AuditStaff"."shift_id" = "_shift"."id"
          AND "_shift"."event_id" = ${event_id} AND "_shift"."id" = "shift"."id"
          LEFT OUTER JOIN "vendors" AS "vendor" ON "AuditStaff"."vendor_id" = "vendor"."id"
          GROUP BY "vendor"."id") AS subquery_counts
      )`),
    'vendorCounts',
  ],
  [
    Sequelize.literal(`(
        SELECT JSON_AGG(subquery_counts)
        FROM
          (SELECT
            COUNT("AuditStaff"."id")::INT AS "totalCount",
            COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT AS "totalCheckedInCount",
            "vendor_positions"."name" AS "positionName"
          FROM "audit"."staff" AS "AuditStaff"
          INNER JOIN "audit"."shifts" AS "_shift" ON "AuditStaff"."shift_id" = "_shift"."id"
          AND "_shift"."event_id" = ${event_id} AND "_shift"."id" = "shift"."id"
          LEFT OUTER JOIN "vendor_positions" AS "vendor_positions" ON "AuditStaff"."vendor_position_id" = "vendor_positions"."id"
          GROUP BY "vendor_positions"."id") AS subquery_counts
      )`),
    'positionCounts',
  ],
  ...shiftCurrentBaseAttributes,
  [Sequelize.literal('"shift"."name"'), 'shiftName'],
  [Sequelize.literal('"shift"."id"'), 'shiftId'],
  [Sequelize.literal('"shift"."start_date"'), 'startDate'],
];

export const assetsAttributes: FindAttributeOptions = [
  [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'totalCheckedInCount',
  ],
  [Sequelize.literal('"vendor"."name"'), 'vendorName'],
];

export const allPositionCountsAttriubutes: FindAttributeOptions = [
  [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'totalCheckedInCount',
  ],
  [Sequelize.literal('"vendor_position"."name"'), 'positionName'],
];

export const allPositionCountAttributes: FindAttributeOptions = [
  [
    Sequelize.literal('COUNT("vendor_position"."id")::INT'),
    'vendorPositionTotalCount',
  ],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'vendorPositionCheckedInCount',
  ],
  [Sequelize.literal('"vendor_position"."name"'), 'vendorPositionName'],
];
