/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BadRequestException } from '@nestjs/common';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { getStartEndTimezoneUtc, staffWhere } from '@Common/helpers';
import {
  AuditShift,
  AuditStaff,
  Vendor,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { RESPONSES } from '@ontrack-tech-group/common/constants';

import {
  VendorInterface,
  deleteEmptyShifts,
  sendAuditStaffClearUpdate,
  shiftWhere,
  vendorDataSerializer,
} from '../helper';
import { AddRemoveStaffDto } from '../dto';

export const shiftCurrentRate = [
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
];

export const totalExpectedCost = [
  Sequelize.literal(`
    COALESCE(SUM(
      EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate"
    ), 0)
  `),
  'totalCost',
];

export const totalHourByPosition = [
  Sequelize.literal(`
      COALESCE(SUM(
        CASE
          WHEN "AuditStaff"."checked_out" IS NULL AND
              "AuditStaff"."checked_in" + INTERVAL '24 hours' > NOW()
            THEN EXTRACT(EPOCH FROM (NOW() - "AuditStaff"."checked_in")) / 3600
          WHEN "AuditStaff"."checked_out" IS NULL
            THEN EXTRACT(EPOCH FROM ("shift"."end_date" - "AuditStaff"."checked_in")) / 3600
          ELSE
            EXTRACT(EPOCH FROM ("AuditStaff"."checked_out" - "AuditStaff"."checked_in")) / 3600
        END
      ), 0)
    `),
  'totalHours',
];

export const totalExpectedHourByPosition = [
  Sequelize.literal(`
      COALESCE(SUM(
        EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600
      ), 0)
    `),
  'totalHours',
];

export const allTotalRate = (
  date: string,
  timezone: string,
  dateGroup = false,
  event_id: number,
) => {
  let startDate = null;
  let endDate = null;

  if (date) {
    const dates = getStartEndTimezoneUtc(date, timezone);
    startDate = dates.startDate;
    endDate = dates.endDate;
  }

  return [
    Sequelize.literal(`(
    SELECT SUM(EXTRACT(EPOCH FROM ("audit_shift"."end_date" - "audit_shift"."start_date")) / 3600 * "audit_staff"."rate")
    FROM "audit"."staff" AS "audit_staff"
    INNER JOIN "audit"."shifts" AS "audit_shift" ON "audit_staff"."shift_id" = "audit_shift"."id"
    WHERE "audit_staff"."vendor_id" = "vendor"."id" AND "audit_shift"."event_id" = ${event_id}
    ${date ? `AND "audit_shift"."start_date" BETWEEN '${startDate}' AND '${endDate}'` : dateGroup ? `AND "audit_staff"."shift_id" = "shift"."id"` : ''}
  )`),
    'totalRate',
  ];
};

export const allCurrentRate = [
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
];

export const allPositionCount = (
  date: string,
  timezone: string,
  dateGroup = false,
  event_id: number,
) => {
  let startDate = null;
  let endDate = null;

  if (date) {
    const dates = getStartEndTimezoneUtc(date, timezone);
    startDate = dates.startDate;
    endDate = dates.endDate;
  }

  return [
    Sequelize.literal(`
    (
      SELECT JSON_AGG(subquery_counts)
      FROM (
        SELECT
          COUNT("VendorPosition"."id") AS vendorPositionTotalCount,
          "VendorPosition"."name" AS vendorPositionName,
          COUNT(CASE WHEN "audit_staff"."checked_in" IS NOT NULL THEN 1 END) AS vendorPositionCheckedInCount
        FROM "audit"."staff" AS "audit_staff"
        INNER JOIN "audit"."shifts" AS "AuditShift" ON "AuditShift"."id" = "audit_staff"."shift_id"
        INNER JOIN "vendor_positions" AS "VendorPosition" ON "VendorPosition"."id" = "audit_staff"."vendor_position_id"
        WHERE "audit_staff"."vendor_id" = "vendor"."id" AND "AuditShift"."event_id" = ${event_id} ${date ? `AND "AuditShift"."start_date" BETWEEN '${startDate}' AND '${endDate}'` : dateGroup ? `AND "audit_staff"."shift_id" = "shift"."id"` : ''}
        GROUP BY "VendorPosition"."id"
      ) AS subquery_counts
    )
  `),
    'positionCounts',
  ];
};

export const alignedShifts = [
  [
    Sequelize.literal(
      `CASE WHEN "aligned_checked_in" IS NOT NULL THEN TRUE ELSE FALSE END`,
    ),
    'aligned_checked_in',
  ],
  [
    Sequelize.literal(
      `CASE WHEN "aligned_checked_out" IS NOT NULL THEN TRUE ELSE FALSE END`,
    ),
    'aligned_checked_out',
  ],
];

export const staffCountForEachShiftRawAttributes = [
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

export const staffCountForEachShiftTotalRawAttributes = [
  [Sequelize.literal('COUNT("vendor_position"."id")::INT'), 'totalCount'],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'totalCheckedInCount',
  ],
  [
    Sequelize.literal(
      'CAST((COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::FLOAT / COUNT("vendor_position"."id")::FLOAT) * 100 AS NUMERIC(10, 2))::FLOAT',
    ),
    'checkedInPercentage',
  ],
  [Sequelize.literal('"shift"."end_date"'), 'endDate'],
  [
    Sequelize.literal(
      'SUM(EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate")',
    ),
    'totalRate',
  ],
  shiftCurrentRate,
];

export const allCountsForEachVendorRawAttributes = (
  date: string,
  timezone: string,
  event_id: number,
) => [
  [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
    ),
    'totalCheckedInCount',
  ],
  [
    Sequelize.literal(
      'CAST((COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::FLOAT / COUNT("AuditStaff"."id")::FLOAT) * 100 AS NUMERIC(10, 2))::FLOAT',
    ),
    'checkedInPercentage',
  ],
  [Sequelize.literal('"vendor"."name"'), 'vendorName'],
  [Sequelize.literal('"vendor"."id"'), 'vendorId'],
  [Sequelize.literal('"shift"."start_date"'), 'startDate'],
  allTotalRate(date, timezone, true, event_id),
  allCurrentRate,
];

export const getVendorStaffShift = async (
  timezone: string,
  event_id: number,
  vendor_id?: number,
  dates?: string[],
  priority?: boolean,
): Promise<VendorInterface[]> => {
  const where: WhereOptions = {};

  if (vendor_id) where['id'] = vendor_id;

  const allData = await Vendor.findAll({
    where,
    include: [
      {
        model: AuditStaff,
        required: true,
        paranoid: false,
        as: 'staff',
        where: staffWhere(priority),
        include: [
          {
            model: AuditShift,
            where: shiftWhere({ event_id, dates, timezone }),
            required: true,
            as: 'shift',
          },
        ],
      },
    ],
    order: [[Sequelize.literal(`"staff->shift"."start_date"`), 'ASC']],
  });

  /*
      "vendorDataSerializer": this method will convert all data to JSON object
      and also add totalRate & currentRate in each staff
    */
  return vendorDataSerializer(allData, timezone);
};

export async function deleteStaff(
  addRemoveBulkStaffDto: AddRemoveStaffDto,
  pusherService: PusherService,
  timezone: string,
) {
  const { event_id, vendor_id, shift_id, position_id, quantity } =
    addRemoveBulkStaffDto;

  const limit = Math.abs(quantity);
  const staffToDelete = (
    await AuditStaff.findAll({
      where: {
        [Op.or]: [
          {
            // Both are null
            checked_in: null,
            checked_out: null,
          },
          {
            // Both are not null
            checked_in: { [Op.ne]: null },
            checked_out: { [Op.ne]: null },
          },
        ],
        vendor_id,
        vendor_position_id: position_id,
        shift_id,
      },
      attributes: ['id'],
      include: [
        {
          model: AuditShift,
          where: { event_id },
          attributes: [],
        },
      ],
      limit,
    })
  ).map((staff) => staff.id);

  if (staffToDelete.length < limit)
    throw new BadRequestException(
      `Only ${staffToDelete.length} staffs are available for the selected vendor, position, and shift!`,
    );

  await AuditStaff.destroy({
    where: {
      id: { [Op.in]: staffToDelete },
    },
  });

  // Deleting shifts: If a staff member is being deleted and their shifts are being retrieved, then any shifts with no remaining associated staff will also be deleted.
  // Check if any shifts are left without staff, and delete them
  await deleteEmptyShifts([shift_id], event_id);

  sendAuditStaffClearUpdate(pusherService, event_id, staffToDelete, timezone);

  return { message: RESPONSES.destroyedSuccessfully('Staff') };
}
