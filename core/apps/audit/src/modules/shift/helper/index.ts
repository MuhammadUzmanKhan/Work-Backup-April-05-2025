// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import momentTimezone from 'moment-timezone';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NotFoundException } from '@nestjs/common';
import { RESPONSES, SortBy } from '@ontrack-tech-group/common/constants';
import { AuditShift } from '@ontrack-tech-group/common/models';
import {
  AllShiftsSortingColumns,
  ShiftsToCreateInterface,
  StaffInShiftSortingColumns,
} from '@Common/constants';
import { getStartEndTimezoneUtc } from '@Common/helpers';

import { GetAllShiftsDto, GetShiftByIdDto } from '../dto';

export const getAllShiftsWhere = (
  getAllShiftsDto: GetAllShiftsDto,
  timezone: string,
) => {
  const { keyword, date, event_id } = getAllShiftsDto;
  const where = { event_id };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (date) {
    const { startDate, endDate } = getStartEndTimezoneUtc(date, timezone);

    where['start_date'] = { [Op.between]: [startDate, endDate] };
  }

  return where;
};

export const getOrderOfAllShifts = (getAllShiftsDto: GetAllShiftsDto) => {
  const { order, sort_column } = getAllShiftsDto;
  let _order = [[Sequelize.literal(`"start_date" ${SortBy.ASC}`)]];

  if (sort_column)
    switch (sort_column) {
      case AllShiftsSortingColumns.START_DATE:
        _order = [[Sequelize.literal(`"start_date" ${order}`)]];
        break;
      case AllShiftsSortingColumns.START_TIME:
        _order = [
          [Sequelize.literal(`TO_CHAR(start_date, 'HH24:MI:SS') ${order}`)],
        ];
        break;
      case AllShiftsSortingColumns.END_TIME:
        _order = [
          [Sequelize.literal(`TO_CHAR(end_date, 'HH24:MI:SS') ${order}`)],
        ];
        break;
      default:
        _order = [[sort_column, order]];
        break;
    }

  return _order;
};

export const isShiftExist = async (id: number) => {
  const shift = await AuditShift.findByPk(id, {
    attributes: { exclude: ['updated_at'] },
  });

  if (!shift) throw new NotFoundException(RESPONSES.notFound('Shift'));

  return shift;
};

export const getShiftByIdHelper = async (id: number) => {
  const shift = await AuditShift.findByPk(id, {
    attributes: ['id', 'event_id'],
  });

  return shift;
};

export const getShiftByIdWhere = (getShiftByIdDto: GetShiftByIdDto) => {
  const { keyword } = getShiftByIdDto;
  const where = {};

  if (keyword) {
    where[Op.or] = [
      { qr_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      {
        '$"vendor_position"."name"$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$"vendor"."name"$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
    ];
  }

  return where;
};

export const getShiftByIdSubqueries = (getShiftByIdDto: GetShiftByIdDto) => {
  const { keyword } = getShiftByIdDto;

  const joinString = `
      LEFT OUTER JOIN "vendors" AS "staff->vendor" ON "staff"."vendor_id" = "staff->vendor"."id"
      LEFT OUTER JOIN "vendor_positions" AS "staff->vendor_position" ON "staff"."vendor_position_id" = "staff->vendor_position"."id"
      WHERE ("staff"."qr_code" ILIKE '%${keyword?.toLowerCase()}%'
      OR "staff->vendor_position"."name" ILIKE '%${keyword?.toLowerCase()}%'
      OR "staff->vendor"."name" ILIKE '%${keyword?.toLowerCase()}%')
      AND`;

  return [
    [
      Sequelize.literal(`(
          SELECT COUNT("staff"."id")::int FROM "audit"."staff" AS "staff"
          ${keyword ? joinString : 'WHERE '}
          "staff"."shift_id" = "AuditShift"."id"
        )`),
      'total_staff',
    ],
    [
      Sequelize.literal(`(
          SELECT COUNT("staff"."id")::int FROM "audit"."staff" AS "staff"
          ${keyword ? joinString : 'WHERE '}
          "staff"."shift_id" = "AuditShift"."id" AND "staff"."checked_in" IS NOT NULL
          AND "staff"."checked_out" IS NULL
        )`),
      'checked_in_staff',
    ],
    [
      Sequelize.literal(`(
          SELECT COUNT("staff"."id")::int FROM "audit"."staff" AS "staff"
          ${keyword ? joinString : 'WHERE '}
          "staff"."shift_id" = "AuditShift"."id"
          AND "staff"."checked_out" IS NOT NULL
        )`),
      'checked_out_staff',
    ],
  ];
};

export const getOrderOfAllStaff = (getShiftByIdDto: GetShiftByIdDto) => {
  const { order, sort_column } = getShiftByIdDto;
  let _order = [];

  if (sort_column) {
    switch (sort_column) {
      case StaffInShiftSortingColumns.CHECKED_IN:
        _order.push([
          Sequelize.literal(`TO_CHAR("checked_in", 'HH24:MI:SS') ${order}`),
        ]);
        break;
      case StaffInShiftSortingColumns.CHECKED_OUT:
        _order.push([
          Sequelize.literal(`TO_CHAR("checked_out", 'HH24:MI:SS') ${order}`),
        ]);
        break;
      case StaffInShiftSortingColumns.POSITION:
        _order.push([Sequelize.literal(`"vendor_position"."name" ${order}`)]);
        break;
      case StaffInShiftSortingColumns.VENDOR_NAME:
        _order.push([Sequelize.literal(`"vendor"."name" ${order}`)]);
        break;
      default:
        _order.push([Sequelize.col('qr_code'), order]);
        break;
    }
  } else {
    _order = [
      [Sequelize.literal('is_flagged'), SortBy.DESC],
      [Sequelize.literal('checked_in'), SortBy.DESC],
    ];
  }

  return _order;
};

export const getAllShiftsHelper = async (
  shifts: {
    event_id: number;
    name: string;
    start_date: string;
    end_date: string;
    index: number;
  }[],
) => {
  const conditions = shifts
    .map((shift) => {
      return `(event_id = ${shift.event_id} AND start_date = '${shift.start_date}' AND end_date = '${shift.end_date}')`;
    })
    .join(' OR ');

  const where = Sequelize.literal(conditions);

  return await AuditShift.findAll({
    where,
    attributes: ['id', 'name', 'start_date', 'end_date'],
    raw: true,
  });
};

export const bulkShiftsCreate = async (
  shifts: ShiftsToCreateInterface[],
  transaction: Transaction,
  totalObjects: number,
) => {
  let newlyCreatedShifts: AuditShift[] = [];
  const allShifts = new Array(totalObjects);

  const alreadyExistShifts = (await getAllShiftsHelper(shifts)).map(
    (_shift) => ({
      ..._shift,
      start_date: _shift.start_date.toISOString(),
      end_date: _shift.end_date.toISOString(),
    }),
  );

  const shiftsToBeCreate = shifts.filter((shift) => {
    return !alreadyExistShifts.some(
      (existingShift) =>
        shift.start_date === existingShift.start_date &&
        shift.end_date === existingShift.end_date,
    );
  });

  if (shiftsToBeCreate.length) {
    newlyCreatedShifts = await AuditShift.bulkCreate(shiftsToBeCreate, {
      transaction,
    });
  }

  [
    ...newlyCreatedShifts.map((shift) => shift.get({ plain: true })),
    ...alreadyExistShifts,
  ].forEach((shift) => {
    const bodyShifts = shifts.find(
      (_shift) =>
        _shift.start_date ==
          (typeof shift.start_date === 'string'
            ? shift.start_date
            : shift.start_date.toISOString()) &&
        _shift.end_date ==
          (typeof shift.end_date === 'string'
            ? shift.end_date
            : shift.end_date.toISOString()),
    );

    if (!bodyShifts) return;

    if (!allShifts[bodyShifts.index]) {
      allShifts[bodyShifts.index] = [];
    }

    allShifts[bodyShifts.index].push(shift);
  });

  return allShifts;
};

export const isShiftListExist = async (ids: number[], event_id: number) => {
  if (ids?.length) {
    const shiftCount = await AuditShift.count({
      where: { id: { [Op.in]: ids }, event_id },
    });

    if (shiftCount !== ids.length)
      throw new NotFoundException(RESPONSES.notFound('Some Of Shifts'));
  }
};

export const getShiftDates = async (event_id: number, timezone: string) => {
  return (
    await AuditShift.findAll({
      where: { event_id },
      attributes: ['start_date'],
      order: [['start_date', SortBy.ASC]],
    })
  ).map((shift) =>
    momentTimezone.utc(shift.start_date).tz(timezone).format('YYYY-MM-DD'),
  );
};
