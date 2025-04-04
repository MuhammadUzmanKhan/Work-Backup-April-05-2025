/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import momentTimezone from 'moment-timezone';
import { Op, Sequelize, Transaction } from 'sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import moment from 'moment';
import {
  CsvOrPdf,
  Options,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  AuditNote,
  AuditShift,
  AuditStaff,
  Event,
  Image,
  User,
  Vendor,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import {
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import {
  ShiftsToCreateInterface,
  StaffSortingColumns,
  VendorAssets,
  _ERRORS,
} from '@Common/constants';
import { bulkShiftsCreate, isShiftExist } from '@Modules/shift/helper';
import {
  bulkPositionsCreate,
  isVendorPositionExist,
} from '@Modules/vendor-position/helper';
import { isVendorExist } from '@Modules/vendor/helper';
import { getStartEndTimezoneUtc, staffWhere } from '@Common/helpers';

import {
  AttendanceAuditDto,
  GetStaffByEventDto,
  PositionCountDto,
  ReUploadStaffAndShiftDto,
  UpdateAttendanceMobileDto,
} from '../dto';
import {
  alignedShifts,
  allCountsForEachVendorRawAttributes,
  allPositionCount,
  shiftCurrentRate,
  staffCountForEachShiftRawAttributes,
  staffCountForEachShiftTotalRawAttributes,
} from '../queries';

import { getShiftsWhere } from './where';

export const getAllStaffWhere = (
  getStaffByEventDto: GetStaffByEventDto,
  timeZone: string,
) => {
  const {
    keyword,
    date,
    vendor_id,
    dates,
    vendor_position_id,
    priority,
    is_flagged,
    shift_id,
  } = getStaffByEventDto;
  const where = {};

  if (keyword) {
    where[Op.or] = [
      { qr_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      {
        '$vendor_position.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` },
      },
      { '$vendor.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$shift.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  if (priority) {
    where['priority'] = priority;
  }

  if (is_flagged) {
    where['is_flagged'] = is_flagged;
  }

  if (vendor_position_id) {
    where['vendor_position_id'] = vendor_position_id;
  }

  if (shift_id) {
    where['shift_id'] = shift_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDateRanges: any[] = [];

  if (dates) {
    dates.forEach((date) => {
      const { startDate, endDate } = getStartEndTimezoneUtc(date, timeZone);
      startDateRanges.push({
        [Op.between]: [startDate, endDate],
      });
    });

    where['$shift.start_date$'] = { [Op.or]: startDateRanges };
  }

  if (date) {
    const { startDate, endDate } = getStartEndTimezoneUtc(date, timeZone);

    where['$shift.start_date$'] = { [Op.between]: [startDate, endDate] };
  }

  if (vendor_id) {
    where['vendor_id'] = vendor_id;
  }

  return where;
};

export const getOrderOfAllStaff = (getStaffByEventDto: GetStaffByEventDto) => {
  const { order, sort_column } = getStaffByEventDto;
  let _order = [];

  if (sort_column) {
    switch (sort_column) {
      case StaffSortingColumns.EXPECTED_START_DATE:
        _order.push(
          [Sequelize.literal(`"expected_start_date" ${order}`)],
          ['id', order],
        );
        break;
      case StaffSortingColumns.SHIFT_START:
        _order.push(
          [Sequelize.literal(`shift_start_time ${order}`)],
          ['id', order],
        );
        break;
      case StaffSortingColumns.SHIFT_END:
        _order.push(
          [Sequelize.literal(`shift_end_time ${order}`)],
          ['id', order],
        );
        break;
      default:
        _order.push([sort_column, order]);
        break;
    }
  } else {
    _order = [
      [Sequelize.col('"is_flagged"'), SortBy.DESC],
      [Sequelize.literal(`"expected_start_date" ${SortBy.ASC}`)],
      ['id', SortBy.ASC],
    ];
  }

  return _order;
};

export const mappedAttendanceAuditData = (
  staffCountForEachShift,
  staffCountForEachShiftTotal,
  allCountsForEachVendor,
) => {
  const result = mergeAllStatsArraysInResultForVendorStats(
    staffCountForEachShift,
    staffCountForEachShiftTotal,
    allCountsForEachVendor,
  );

  const transformedResult = Object.keys(result).map((vendorId) => {
    const vendorData = result[vendorId];
    const shifts = Object.keys(vendorData)
      .filter(
        (key) => key !== 'vendorId' && key !== 'vendorName' && key !== 'all',
      )
      .map((shiftId) => {
        const shiftData = vendorData[shiftId];
        const { positionCounts, ...shiftDetails } = shiftData;
        return { shiftId, ...shiftDetails, positionCounts };
      });

    const vendorInfo = {
      vendorId: vendorData.vendorId,
      vendorName: vendorData.vendorName,
    };
    const allData = { all: vendorData.all };

    return { ...vendorInfo, ...allData, shifts };
  });

  return transformedResult;
};

export const commonInclude = (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
) => {
  return [
    {
      model: AuditShift,
      where: getShiftsWhere(attendanceAuditDto, timezone),
      attributes: [],
    },
    {
      model: Vendor,
      attributes: [],
    },
    {
      model: VendorPosition,
      attributes: [],
    },
  ];
};

export const commonAttributes = [
  [Sequelize.literal('"shift"."name"'), 'shiftName'],
  [Sequelize.literal('"shift"."id"'), 'shiftId'],
  [Sequelize.literal('"vendor"."name"'), 'vendorName'],
  [Sequelize.literal('"vendor"."id"'), 'vendorId'],
  [Sequelize.literal('"shift"."start_date"'), 'startDate'],
];

export const isStaffExist = async (id: number, event_id?: number) => {
  const staff = await AuditStaff.findByPk(id, {
    attributes: [
      'id',
      'checked_in',
      'checked_out',
      'is_flagged',
      'shift_id',
      'priority',
    ],
    include: [
      {
        model: AuditShift,
        attributes: ['event_id'],
        where: event_id ? { event_id } : {},
      },
    ],
  });

  if (!staff) {
    throw new NotFoundException(RESPONSES.notFound('Staff'));
  }

  return staff;
};

export const getStaffByIdHelper = async (id: number, event_id?: number) => {
  const staff = await AuditStaff.findByPk(id, {
    attributes: ['id', 'checked_in'],
    include: [
      {
        model: AuditShift,
        attributes: ['id', 'event_id'],
        where: event_id ? { event_id } : {},
      },
    ],
  });

  return staff;
};

export const destroyStaffByShiftId = async (
  id: number,
  transaction?: Transaction,
) => {
  await AuditStaff.destroy({ where: { shift_id: id }, transaction });
};

export const getCsvForStaffListing = async (
  staff,
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  // Formatting data for csv
  const formattedStaffForComparison = getFormattedDataForStaffListingCsv(staff);

  // Api call to lambda for getting csv
  const response = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedStaffForComparison,
    CsvOrPdf.CSV,
  );

  // Setting Headers for csv and sending csv in response
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="staff.csv"');
  return res.send(response.data);
};

// Helper functions to format specific fields
const formatDate = (date, timeZone, format) =>
  date ? moment(date).utcOffset(timeZone).format(format) : '--';

const getShiftTime = (staff, key, timeZone) =>
  formatDate(staff[key], timeZone, 'hh:mm A');

const stringPlaceholder = (str?: string) => str || '--';

const formatStaffData = (staff) => ({
  Date: formatDate(staff.expected_start_date, staff.time_zone, 'YYYY-MM-DD'),
  Vendor: stringPlaceholder(staff.vendor_name),
  Position: stringPlaceholder(staff.position),
  Shift: stringPlaceholder(staff.shift_name),
  'Shift Start': getShiftTime(staff, 'expected_start_date', staff.time_zone),
  'Shift End': getShiftTime(staff, 'expected_end_date', staff.time_zone),
  'Check In': getShiftTime(staff, 'checked_in', staff.time_zone),
  'Check Out': getShiftTime(staff, 'checked_out', staff.time_zone),
  'QR ID': stringPlaceholder(staff.qr_code),
  'Check In Aligned': staff.aligned_checked_in ? 'Yes' : 'No',
  'Check Out Aligned': staff.aligned_checked_out ? 'Yes' : 'No',
  Flag: staff.is_flagged ? 'Yes' : 'No',
});

export const getFormattedDataForStaffListingCsv = (staff) => {
  return staff.map(formatStaffData);
};

export const getRecursiveShiftEndDate = (
  date: string,
  start_date: string,
  end_date: string,
) => {
  const startDate = moment.utc(start_date);
  const endDate = moment.utc(end_date);

  if (startDate.date() == endDate.date()) {
    return `${date}T${end_date.split('T')[1]}`;
  } else {
    const endDate = moment(date).add(1, 'days');

    return `${endDate.format('YYYY-MM-DD')}T${end_date.split('T')[1]}`;
  }
};

export const validationsForMobileAttendance = async (
  updateAttendanceMobileDto: UpdateAttendanceMobileDto,
  user: User,
) => {
  const { vendor_id, vendor_position_id, shift_id, event_id } =
    updateAttendanceMobileDto;

  await isShiftExist(shift_id);
  await isVendorPositionExist(vendor_position_id);
  await isVendorExist(vendor_id);

  await withCompanyScope(user, event_id);
};

export const formatShiftName = (date: string, timeZone: string): string => {
  const momentUtc = momentTimezone.utc(date).tz(timeZone);

  return momentUtc.format('M/D dddd h:mm A');
};

export const getOrderedVsDelivered = (
  orderedVsDelivered,
  totalCheckedInAssets: number,
  totalAssets: number,
) => {
  return {
    ...orderedVsDelivered.reduce(
      (accumulator, currentValue) => {
        accumulator.totalRate += currentValue.totalRate;
        accumulator.currentRate += currentValue.currentRate;
        return accumulator;
      },
      {
        totalRate: 0,
        currentRate: 0,
      },
    ),
    checkedInPercentage: parseFloat(
      ((totalCheckedInAssets / totalAssets) * 100).toFixed(2),
    ),
  };
};

export const getAssetsByVendors = async (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
) => {
  const { priority } = attendanceAuditDto;

  const assets = await AuditStaff.findAll({
    where: staffWhere(priority),
    attributes: [
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
    ],
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(attendanceAuditDto, timezone),
        attributes: [],
      },
      {
        model: Vendor,
        attributes: [],
      },
    ],
    group: [`"vendor"."id"`],
    order: [[Sequelize.literal('"vendor"."name"'), 'ASC']],
    raw: true,
  });

  const totalAssets = assets.reduce(
    (total, asset) => total + asset['totalCount'],
    0,
  );

  const totalCheckedInAssets = assets.reduce(
    (total, asset) => total + asset['totalCheckedInCount'],
    0,
  );

  const totalCheckedInPercentage = (
    (totalCheckedInAssets / totalAssets) *
    100
  ).toFixed(2);

  return {
    assets,
    totalAssets,
    totalCheckedInAssets,
    totalCheckedInPercentage: parseFloat(totalCheckedInPercentage),
  };
};

/**
 *
 * @param _assets
 * @returns It returns an array of objects formatted as date and assets of diff vendors
 * on that date. And then total counts for all assets of all vendors for that date.
 * assets will be categorized with respect to dates.
 */
export const getAssetsByVendorsForSocketFormatResponse = (
  _assets: VendorAssets[],
) => {
  const result = [];

  // Use a Map to track processed dates and their corresponding index in the result array
  const dateMap = new Map();

  for (const asset of _assets) {
    const { date, totalCount, totalCheckedInCount, vendorName, vendorId } =
      asset;
    let dateEntry = dateMap.get(date);

    if (!dateEntry) {
      // If the date is not yet processed, add it to the result and update the Map
      dateEntry = {
        date,
        assets: [],
        totalAssets: 0,
        totalCheckedInAssets: 0,
        totalCheckedInPercentage: 0,
      };
      result.push(dateEntry);
      dateMap.set(date, dateEntry);
    }

    // Check if the vendor is already added for the date
    const vendorIndex = dateEntry.assets.findIndex(
      (value) => value.vendorId === vendorId,
    );

    if (vendorIndex > -1) {
      // If the vendor exists, update the counts
      dateEntry.assets[vendorIndex].totalCount += totalCount;
      dateEntry.assets[vendorIndex].totalCheckedInCount += totalCheckedInCount;
      dateEntry.assets[vendorIndex].checkedInPercentage = parseFloat(
        (
          (dateEntry.assets[vendorIndex].totalCheckedInCount /
            dateEntry.assets[vendorIndex].totalCount) *
          100
        ).toFixed(2),
      );
    } else {
      // If not, add the vendor to the assets array
      dateEntry.assets.push({
        totalCount,
        totalCheckedInCount,
        checkedInPercentage: parseFloat(
          ((totalCheckedInCount / totalCount) * 100).toFixed(2),
        ),
        vendorName,
        vendorId,
      });
    }

    const totalAssets = (dateEntry.totalAssets += totalCount);

    const totalCheckedInAssets = (dateEntry.totalCheckedInAssets +=
      totalCheckedInCount);

    dateEntry.totalCheckedInPercentage = parseFloat(
      ((totalCheckedInAssets / totalAssets) * 100).toFixed(2),
    );
  }

  return result;
};

export const getAssetsByVendorsForSockets = async (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
) => {
  const assets = (
    await AuditStaff.findAll({
      attributes: [
        [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalCheckedInCount',
        ],
        [Sequelize.literal('"vendor"."name"'), 'vendorName'],
        [Sequelize.literal('"vendor"."id"'), 'vendorId'],
        [Sequelize.literal('"shift"."start_date"'), 'utc_start_date'],
      ],
      include: [
        {
          model: AuditShift,
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
        {
          model: Vendor,
          attributes: [],
        },
      ],
      group: [`"vendor"."id"`, `"shift"."start_date"`],
      raw: true,
    })
  ).map((asset) => ({
    ...asset,
    date: momentTimezone
      .utc(asset['utc_start_date'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const assetsSummaryForSockets = getAssetsByVendorsForSocketFormatResponse(
    assets as unknown as VendorAssets[],
  );

  return assetsSummaryForSockets;
};

export const getStaffById = async (
  id: number,
  event_id: number,
  options?: Options,
) => {
  return await AuditStaff.findOne({
    where: {
      id,
    },
    attributes: [
      'id',
      'qr_code',
      'is_flagged',
      'pos',
      'checked_in',
      'checked_out',
      'priority',
      'shift_id',
      [Sequelize.literal(`vendor_position.name`), 'position'],
      [Sequelize.literal(`vendor.name`), 'vendor_name'],
      [Sequelize.literal(`vendor.id`), 'vendor_id'],
      [Sequelize.literal(`shift.name`), 'shift_name'],
      [Sequelize.literal(`shift.start_date`), 'expected_start_date'],
      [Sequelize.literal(`shift.end_date`), 'expected_end_date'],
      [Sequelize.literal(`"shift->events"."time_zone"`), 'time_zone'],
      [
        Sequelize.literal(`COALESCE(checked_in, shift.start_date)`),
        'shift_start',
      ],
      [Sequelize.literal(`COALESCE(checked_out, shift.end_date)`), 'shift_end'],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_in, shift.start_date), 'HH24:MI:SS')`,
        ),
        'shift_start_time',
      ],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_out, shift.end_date), 'HH24:MI:SS')`,
        ),
        'shift_end_time',
      ],
      ...alignedShifts,
    ],
    include: [
      {
        model: AuditShift,
        where: { event_id },
        attributes: [],
        required: true,
        include: [
          {
            model: Event,
            attributes: [],
          },
        ],
      },
      {
        model: Vendor,
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    raw: true,
    ...options,
  });
};

export const getStaffByIds = async (
  ids: number[],
  event_id: number,
  options?: Options,
) => {
  return await AuditStaff.findAll({
    where: {
      id: ids,
    },
    attributes: [
      'id',
      'qr_code',
      'is_flagged',
      'pos',
      'checked_in',
      'checked_out',
      'priority',
      [Sequelize.literal(`vendor_position.name`), 'position'],
      [Sequelize.literal(`vendor.name`), 'vendor_name'],
      [Sequelize.literal(`vendor.id`), 'vendor_id'],
      [Sequelize.literal(`shift.name`), 'shift_name'],
      [Sequelize.literal(`shift.start_date`), 'expected_start_date'],
      [Sequelize.literal(`shift.end_date`), 'expected_end_date'],
      [Sequelize.literal(`"shift->events"."time_zone"`), 'time_zone'],
      [
        Sequelize.literal(`COALESCE(checked_in, shift.start_date)`),
        'shift_start',
      ],
      [Sequelize.literal(`COALESCE(checked_out, shift.end_date)`), 'shift_end'],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_in, shift.start_date), 'HH24:MI:SS')`,
        ),
        'shift_start_time',
      ],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_out, shift.end_date), 'HH24:MI:SS')`,
        ),
        'shift_end_time',
      ],
      ...alignedShifts,
    ],
    include: [
      {
        model: AuditShift,
        where: { event_id },
        attributes: [],
        required: true,
        include: [
          {
            model: Event,
            attributes: [],
          },
        ],
      },
      {
        model: Vendor,
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    raw: true,
    ...options,
  });
};

export const getAllPositionsCount = async (
  positionCountDto: PositionCountDto,
  timezone: string,
) => {
  return await AuditStaff.findAll({
    attributes: [
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
    ],
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(positionCountDto, timezone),
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    group: [`"vendor_position"."id"`],
  });
};

export const deleteEmptyShifts = async (
  shiftIds: number[],
  event_id: number,
) => {
  // Find shift IDs that have staff assigned
  const shiftsWithStaff = await AuditStaff.findAll({
    attributes: ['shift_id'],
    where: { shift_id: shiftIds },
    group: ['shift_id'],
    raw: true, // Fetch plain objects
    useMaster: true,
  });

  // Extract shift IDs that have staff assigned
  const shiftIdsWithStaff = shiftsWithStaff.map(({ shift_id }) => shift_id);

  // Find shift IDs that have no staff
  const emptyShiftIds = shiftIds.filter(
    (id) => !shiftIdsWithStaff.includes(id),
  );

  // Delete empty shifts if any exist
  if (emptyShiftIds.length > 0)
    await AuditShift.destroy({ where: { id: emptyShiftIds, event_id } });
};

export const checkIfShiftsWithinEventDates = (
  shifts: ShiftsToCreateInterface[],
  event: Event,
) => {
  const { start_date, end_date, time_zone } = event;

  shifts.forEach((shift) => {
    const shiftInTimeZone = momentTimezone
      .utc(shift.start_date)
      .tz(time_zone)
      .format('YYYY-MM-DD');

    // Checking shift date by converting it into event time zone that if it exist between event start_date or end_date
    if (
      shiftInTimeZone < start_date.toString() ||
      shiftInTimeZone > end_date.toString()
    ) {
      throw new BadRequestException(
        _ERRORS.SHIFT_DATES_MUST_BE_WITHIN_EVENTS_OPERATIONAL_DATES,
      );
    }
  });
};

export const getAllCreatedShifts = async (
  csv_data: ReUploadStaffAndShiftDto[],
  event: Event,
  transaction: Transaction,
) => {
  const { id: event_id, time_zone } = event;
  // get all shifts from csv data and create an array of objects with event_id as well.
  const shifts = csv_data
    .flatMap(({ start_date, end_date, recursive, staff }, _index) => {
      if (!staff.length) return;

      const formattedStartDate = start_date.split('Z')[0] + '.000Z';
      const formattedEndDate = end_date.split('Z')[0] + '.000Z';

      const name = formatShiftName(formattedStartDate, time_zone);

      const _shifts = [
        {
          name,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          event_id,
          index: _index,
        },
      ];

      if (recursive?.length) {
        recursive.forEach((date) => {
          const _start_date = `${date}T${formattedStartDate.split('T')[1]}`;
          const name = formatShiftName(_start_date, time_zone);

          _shifts.push({
            name,
            start_date: _start_date,
            end_date: getRecursiveShiftEndDate(
              date,
              formattedStartDate,
              formattedEndDate,
            ),
            event_id,
            index: _index,
          });
        });
      }
      return _shifts;
    })
    .filter((shift) => !!shift);

  // it will find existing shifts, and filter csv data shifts if already existing.
  // And then create new shifts which are not already exists and returns all required ones
  return await bulkShiftsCreate(shifts, transaction, csv_data.length);
};

export const getAllCreatedPositions = async (
  csv_data: ReUploadStaffAndShiftDto[],
  companyId: number,
  transaction: Transaction,
) => {
  // get all positions from staff list fron csv data
  const positions = csv_data.flatMap(({ staff }) =>
    staff.map((singleStaff) => ({ position: singleStaff.position })),
  );

  // get unique list of positions
  const uniquePositions = [...new Set(positions.map((item) => item.position))];

  // it will find existing positions, and filter csv data positions if already existing.
  // And then create new positions which are not already exists and returns all required ones
  return await bulkPositionsCreate(uniquePositions, companyId, transaction);
};

export const saveCsv = async (
  url: string,
  fileName: string,
  eventId: number,
  userId: number,
  transaction: Transaction,
) => {
  if (url && fileName) {
    await Image.create(
      {
        name: fileName,
        url,
        imageable_id: eventId,
        imageable_type: PolymorphicType.AUDIT,
        creator_id: userId,
        creator_by: 'User',
        event_id: eventId,
      },
      { transaction },
    );
  }
};

export const sendStaffUpdate = async (
  pusherService: PusherService,
  staff: AuditStaff,
  eventId: number,
  timezone?: string,
) => {
  try {
    if (timezone) {
      const updatedAssets = await getAssetsByVendorsForSockets(
        { event_id: eventId, date: null },
        timezone,
      );
      pusherService.sendAuditStaffAssetsData(updatedAssets, eventId);
    }

    if (staff) {
      pusherService.sendAuditStaffUpdate(staff, eventId);
      pusherService.sendAuditStaffData([{ ...staff, isNew: false }], eventId);
    }
  } catch (error) {}
};

export const sendBulkStaffUpdate = async (
  pusherService: PusherService,
  staff: AuditStaff[],
  eventId: number,
  timezone?: string,
) => {
  try {
    if (timezone) {
      const updatedAssets = await getAssetsByVendorsForSockets(
        { event_id: eventId, date: null },
        timezone,
      );
      pusherService.sendAuditStaffAssetsData(updatedAssets, eventId);
    }

    if (staff.length) {
      pusherService.sendMultipleAuditStaffUpdate(staff, eventId);
      pusherService.sendMultipleAuditStaffData(
        staff.map((_staff) => ({ ..._staff, isNew: false })),
        eventId,
      );
    }
  } catch (error) {}
};

export const sendStaffNotesUpdate = async (
  pusherService: PusherService,
  staffNotes: AuditNote | AuditNote[],
  eventId: number,
) => {
  try {
    pusherService.sendStaffNoteUpdate(staffNotes, eventId);
  } catch (error) {
    console.log('🚀 ~ error:', error);
  }
};

export const sendStaffUpdateStats = async (
  pusherService: PusherService,
  eventId: number,
  timezone: string,
  vendor_id?: number,
  date?: string,
) => {
  try {
    const updatedVendorStats = await getVendorWithShiftsAndStaffCountsForSocket(
      { event_id: eventId, date: date ? date : null },
      timezone,
      vendor_id,
    );

    const orderedVsDelivered = await getOrderedVsDeliveredForSockets(
      { event_id: eventId, date: null },
      timezone,
    );

    pusherService.sendAuditStaffUpdateByDates(
      {
        isAttendanceUpdate: !!vendor_id,
        vendorStats: updatedVendorStats,
      },
      eventId,
    );

    pusherService.sendAuditStaffOrderVsDeliverStats(
      orderedVsDelivered,
      eventId,
    );
  } catch (error) {}
};

export const sendUploadStaffUpdate = async (
  pusherService: PusherService,
  eventId: number,
  staff: AuditStaff[],
  timezone: string,
) => {
  try {
    const createdStaff = await getAllStaffByIds(
      staff.map((staff) => staff.id),
      eventId,
    );

    const updatedAssets = await getAssetsByVendorsForSockets(
      { event_id: eventId, date: null },
      timezone,
    );

    pusherService.sendAuditStaffUploadUpdate(
      RESPONSES.uploadedSuccessfully('Staff'),
      eventId,
    );

    pusherService.sendAuditStaffData(
      createdStaff.map((staff) => ({ ...staff, isNew: true })),
      eventId,
    );

    pusherService.sendAuditStaffAssetsData(updatedAssets, eventId);
  } catch (error) {}
};

export const sendAuditStaffClearUpdate = async (
  pusherService: PusherService,
  eventId: number,
  deletedStaffIds: number[],
  timezone: string,
) => {
  try {
    const updatedAssets = await getAssetsByVendorsForSockets(
      { event_id: eventId, date: null },
      timezone,
    );

    pusherService.sendAuditStaffClearUpdate(
      RESPONSES.destroyedSuccessfully('Staff'),
      eventId,
      deletedStaffIds,
    );

    pusherService.sendAuditStaffAssetsData(updatedAssets, eventId);
  } catch (error) {}
};

export const filterShiftsDataForAggregateCards = (
  staffCountForEachShiftTotal: AuditStaff[],
) => {
  const shiftsVendorCounts = [];
  const shiftsPositionCounts = [];

  staffCountForEachShiftTotal.forEach((shift) => {
    // Clone the shift object for vendorCounts
    const shiftVendorCounts = { ...shift };
    delete shiftVendorCounts['positionCounts']; // Remove positionCounts

    // Clone the shift object for positionCounts
    const shiftPositionCounts = { ...shift };
    delete shiftPositionCounts['vendorCounts']; // Remove vendorCounts

    shiftsVendorCounts.push(shiftVendorCounts);
    shiftsPositionCounts.push(shiftPositionCounts);
  });

  return { shiftsPositionCounts, shiftsVendorCounts };
};

export const getAllStaffByIds = async (
  staffIds: number[],
  event_id: number,
) => {
  return await AuditStaff.findAll({
    where: { id: { [Op.in]: staffIds } },
    attributes: [
      'id',
      'qr_code',
      'is_flagged',
      'pos',
      'checked_in',
      'checked_out',
      [Sequelize.literal(`vendor_position.name`), 'position'],
      [Sequelize.literal(`vendor_position.id`), 'vendor_position_id'],
      [Sequelize.literal(`vendor.name`), 'vendor_name'],
      [Sequelize.literal(`vendor.id`), 'vendor_id'],
      [Sequelize.literal(`shift.name`), 'shift_name'],
      [Sequelize.literal(`shift.id`), 'shift_id'],
      [Sequelize.literal(`shift.start_date`), 'expected_start_date'],
      [Sequelize.literal(`shift.end_date`), 'expected_end_date'],
      [Sequelize.literal(`"shift->events"."time_zone"`), 'time_zone'],
      [
        Sequelize.literal(`COALESCE(checked_in, shift.start_date)`),
        'shift_start',
      ],
      [Sequelize.literal(`COALESCE(checked_out, shift.end_date)`), 'shift_end'],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_in, shift.start_date), 'HH24:MI:SS')`,
        ),
        'shift_start_time',
      ],
      [
        Sequelize.literal(
          `TO_CHAR(COALESCE(checked_out, shift.end_date), 'HH24:MI:SS')`,
        ),
        'shift_end_time',
      ],
    ],
    include: [
      {
        model: AuditShift,
        where: { event_id },
        attributes: [],
        required: true,
        include: [
          {
            model: Event,
            attributes: [],
          },
        ],
      },
      {
        model: Vendor,
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    raw: true,
  });
};

export const getVendorWithShiftsAndStaffCountsForSocket = async (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
  vendor_id?: number,
) => {
  const { date, event_id } = attendanceAuditDto;

  const where = vendor_id ? { vendor_id } : {};

  const staffCountForEachShift = (
    await AuditStaff.findAll({
      where,
      attributes: [...staffCountForEachShiftRawAttributes, ...commonAttributes],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [
        `"vendor_position"."id"`,
        `"vendor"."id"`,
        `"shift"."id"`,
        `"shift"."start_date"`,
      ],
      order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
      raw: true,
    })
  ).map((data) => ({
    ...data,
    date: momentTimezone
      .utc(data['startDate'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const staffCountForEachShiftTotal = (
    await AuditStaff.findAll({
      where,
      attributes: [
        ...staffCountForEachShiftTotalRawAttributes,
        ...commonAttributes,
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"vendor"."id"`, `"shift"."id"`, `"shift"."start_date"`],
      order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
      raw: true,
    })
  ).map((data) => ({
    ...data,
    date: momentTimezone
      .utc(data['startDate'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const allCountsForEachVendor = (
    await AuditStaff.findAll({
      where,
      attributes: [
        ...allCountsForEachVendorRawAttributes(date, timezone, event_id),
        allPositionCount(date, timezone, true, event_id),
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"vendor"."id"`, `"shift"."id"`, `"shift"."start_date"`],
      raw: true,
    })
  ).map((data) => ({
    ...data,
    date: momentTimezone
      .utc(data['startDate'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const stats = formatAttendanceDataForSocket(
    staffCountForEachShift,
    staffCountForEachShiftTotal,
    allCountsForEachVendor,
  );

  return stats;
};

export const formatAttendanceDataForSocket = (
  staffCountForEachShift,
  staffCountForEachShiftTotal,
  allCountsForEachVendor,
) => {
  const groupedData = {};
  const finalResult = [];

  // Aggregate data into date-specific buckets

  staffCountForEachShift.forEach((item) => {
    if (!groupedData[item.date]) {
      groupedData[item.date] = {
        date: item.date,
        _staffCountForEachShift: [],
        _staffCountForEachShiftTotal: [],
        _allCountsForEachVendor: [],
      };
    }
    groupedData[item.date]._staffCountForEachShift.push(item);
  });

  staffCountForEachShiftTotal.forEach((item) => {
    groupedData[item.date]._staffCountForEachShiftTotal.push(item);
  });

  allCountsForEachVendor.forEach((item) => {
    groupedData[item.date]._allCountsForEachVendor.push(item);
  });

  // Convert the object to array sorted by date
  const eachDateData = Object.keys(groupedData).map(
    (date) => groupedData[date],
  );

  eachDateData.forEach((dateData) => {
    const {
      date,
      _staffCountForEachShift,
      _staffCountForEachShiftTotal,
      _allCountsForEachVendor,
    } = dateData;

    const result = mergeAllStatsArraysInResultForVendorStats(
      _staffCountForEachShift,
      _staffCountForEachShiftTotal,
      _allCountsForEachVendor,
      true,
    );

    Object.keys(result).forEach((vendorId) => {
      const vendorData = result[vendorId];
      const shifts = Object.keys(vendorData)
        .filter(
          (key) => key !== 'vendorId' && key !== 'vendorName' && key !== 'all',
        )
        .map((shiftId) => {
          const shiftData = vendorData[shiftId];
          const { positionCounts, ...shiftDetails } = shiftData;
          return { shiftId, ...shiftDetails, positionCounts };
        });
      const vendorInfo = {
        vendorId: vendorData.vendorId,
        vendorName: vendorData.vendorName,
      };

      const transformedResult = { ...vendorInfo, all: vendorData.all, shifts };

      const dateIndex = finalResult.findIndex(
        (dateData) => dateData.date === date,
      );

      if (dateIndex > -1) {
        finalResult[dateIndex].data.push(transformedResult);
      } else finalResult.push({ date, data: [transformedResult] });
    });
  });

  return finalResult;
};

export const mergeAllStatsArraysInResultForVendorStats = (
  staffCountForEachShift,
  staffCountForEachShiftTotal,
  allCountsForEachVendor,
  dateGroup = false,
) => {
  const result = {};

  staffCountForEachShift.forEach((staff) => {
    const {
      vendorId,
      vendorName,
      shiftId,
      shiftName,
      vendorPositionName,
      vendorPositionTotalCount,
      vendorPositionCheckedInCount,
    } = staff;

    const positionCounts = {
      vendorPositionName,
      totalCount: vendorPositionTotalCount,
      checkedInCount: vendorPositionCheckedInCount,
    };

    result[vendorId] = result[vendorId] || {
      vendorId,
      vendorName,
    };

    result[vendorId][shiftId] = result[vendorId][shiftId] || {
      shiftId,
      shiftName,
      positionCounts: [],
    };

    result[vendorId][shiftId].positionCounts.push(positionCounts);
  });

  staffCountForEachShiftTotal.forEach((total) => {
    const {
      vendorId,
      shiftId,
      shiftName,
      totalCount,
      totalCheckedInCount,
      totalRate,
      currentRate,
      checkedInPercentage,
    } = total;

    const totalData = {
      totalCount,
      totalCheckedInCount,
      totalRate,
      currentRate,
      checkedInPercentage,
    };

    if (result[vendorId] && result[vendorId][shiftId]) {
      result[vendorId][shiftId] = {
        ...result[vendorId][shiftId],
        ...totalData,
      };
    } else {
      // If vendorId or shiftId doesn't exist, create them in the result object
      result[vendorId] = result[vendorId] || {
        vendorId,
        vendorName: total.vendorName,
      };
      result[vendorId][shiftId] = result[vendorId][shiftId] || {
        shiftId,
        shiftName,
        positionCounts: [],
        ...totalData,
      };
    }
  });

  allCountsForEachVendor.forEach((all) => {
    const {
      totalCount,
      totalCheckedInCount,
      checkedInPercentage,
      vendorId,
      totalRate,
      currentRate,
      positionCounts,
    } = all;

    const allData = {
      totalCount,
      totalCheckedInCount,
      checkedInPercentage,
      totalRate,
      currentRate,
      positionCounts: positionCounts.map((position) => ({
        vendorPositionName: position.vendorpositionname,
        totalCount: position.vendorpositiontotalcount,
        checkedInCount: position.vendorpositioncheckedincount,
      })),
    };

    if (result[vendorId]) {
      result[vendorId] = {
        ...result[vendorId],
        all: dateGroup
          ? allDataOfEachVendorAdd(result[vendorId]?.all, allData)
          : allData,
      };
    }
  });

  return result;
};

const allDataOfEachVendorAdd = (prevAllData, newAllData) => {
  if (prevAllData) {
    const result = {
      totalCount: 0,
      totalCheckedInCount: 0,
      checkedInPercentage: 0,
      totalRate: 0,
      currentRate: 0,
      positionCounts: {},
    };

    // Sum the totals
    result.totalCount = prevAllData.totalCount + newAllData.totalCount;
    result.totalCheckedInCount =
      prevAllData.totalCheckedInCount + newAllData.totalCheckedInCount;
    result.totalRate = prevAllData.totalRate + newAllData.totalRate;
    result.currentRate = prevAllData.currentRate + newAllData.currentRate;

    result.checkedInPercentage = parseFloat(
      ((result.totalCheckedInCount / result.totalCount) * 100).toFixed(2),
    );

    mergePositions(prevAllData.positionCounts, result);
    mergePositions(newAllData.positionCounts, result);

    // Convert positionCounts object to array
    result.positionCounts = Object.values(result.positionCounts);

    return result;
  } else return newAllData;
};

// Merge position counts
const mergePositions = (positions, result) => {
  positions.forEach((position) => {
    if (result.positionCounts[position.vendorPositionName]) {
      result.positionCounts[position.vendorPositionName].totalCount +=
        position.totalCount;
      result.positionCounts[position.vendorPositionName].checkedInCount +=
        position.checkedInCount;
    } else {
      result.positionCounts[position.vendorPositionName] = { ...position };
    }
  });
};

export const getOrderedVsDeliveredForSockets = async (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
) => {
  const assets = (
    await AuditStaff.findAll({
      attributes: [
        [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalAssets'],
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalCheckedInAssets',
        ],
        [Sequelize.literal('"shift"."start_date"'), 'startDate'],
      ],
      include: [
        {
          model: AuditShift,
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
        {
          model: Vendor,
          attributes: [],
        },
      ],
      group: [`"shift"."id"`],
      raw: true,
    })
  ).map((data) => ({
    ...data,
    date: momentTimezone
      .utc(data['startDate'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const rates = (
    await AuditStaff.findAll({
      attributes: [
        [
          Sequelize.literal(
            'SUM(EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate")',
          ),
          'totalRate',
        ],
        shiftCurrentRate,
        [Sequelize.literal('"shift"."start_date"'), 'startDate'],
      ],
      include: [
        {
          model: AuditShift,
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
      ],
      group: [`"shift"."start_date"`],
      raw: true,
    })
  ).map((data) => ({
    ...data,
    date: momentTimezone
      .utc(data['startDate'])
      .tz(timezone)
      .format('YYYY-MM-DD'),
  }));

  const results = {};

  // Aggregate data from the assets array
  assets.forEach((item) => {
    const { date } = item;
    if (!results[date]) {
      results[date] = {
        totalAssets: 0,
        totalCheckedInAssets: 0,
        totalRate: 0,
        currentRate: 0,
      };
    }
    results[date].totalAssets += item['totalAssets'];
    results[date].totalCheckedInAssets += item['totalCheckedInAssets'];
  });

  // Aggregate data from the rates array
  rates.forEach((item) => {
    const { date } = item;
    if (!results[date]) {
      results[date] = {
        totalAssets: 0,
        totalCheckedInAssets: 0,
        totalRate: 0,
        currentRate: 0,
      };
    }
    results[date].totalRate += item['totalRate'];
    results[date].currentRate += item['currentRate'];
  });

  // Convert the results object into an array format
  const aggregatedData = Object.keys(results).map((date) => ({
    date,
    orderedVsDelivered: {
      totalAssets: results[date].totalAssets,
      totalCheckedInAssets: results[date].totalCheckedInAssets,
      checkedInPercentage: parseFloat(
        (
          (results[date].totalCheckedInAssets / results[date].totalAssets) *
          100
        ).toFixed(2),
      ),
      totalRate: results[date].totalRate,
      currentRate: results[date].currentRate,
    },
  }));

  return aggregatedData;
};

export const getMultipleStaffByIdsHelper = async (ids: number[]) => {
  const staff = await AuditStaff.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'checked_in'],
    include: [
      {
        model: AuditShift,
        attributes: ['id', 'event_id'],
      },
    ],
  });

  if (staff.length !== ids.length) {
    throw new NotFoundException(RESPONSES.notFound('Some of the Staff'));
  }

  return staff;
};

export const formatDataForPdf = (
  positionsByVendors,
  staffByDateAndVendor,
  staffByDateAndPosition,
) => {
  const vendors = {};

  // Organize positions by vendors
  positionsByVendors.forEach((item) => {
    if (!vendors[item.vendorId]) {
      vendors[item.vendorId] = {
        vendorName: item.vendorName,
        vendorId: item.vendorId,
        positionsTotal: 0,
        positionsTotalHours: 0,
        positionsTotalCost: 0,
        positions: [],
        dailyTotals: [],
        dailyDetails: {},
      };
    }

    vendors[item.vendorId].positions.push({
      position: item.position,
      totalStaff: item.totalStaff,
      totalHours: parseFloat(Number(item?.totalHours).toFixed(2)),
      totalCost: parseFloat(Number(item?.currentRate).toFixed(2)),
    });

    // calculating total values for positions
    vendors[item.vendorId].positionsTotal += item.totalStaff;
    vendors[item.vendorId].positionsTotalHours += parseFloat(
      Number(item?.totalHours).toFixed(2),
    );
    vendors[item.vendorId].positionsTotalCost += parseFloat(
      Number(item?.currentRate).toFixed(2),
    );
  });

  // Organize staff by date and vendor
  staffByDateAndVendor.forEach((item) => {
    if (vendors[item.vendorId]) {
      vendors[item.vendorId].dailyTotals.push({
        date: item.date,
        staffTotal: item.totalStaff,
        totalHours: parseFloat(Number(item?.totalHours).toFixed(2)),
        totalCost: parseFloat(Number(item?.currentRate).toFixed(2)),
      });
    }
  });

  // Organize staff by date and position
  staffByDateAndPosition.forEach((item) => {
    if (!vendors[item.vendorId]) {
      vendors[item.vendorId] = {
        vendorName: item.vendorName,
        vendorId: item.vendorId,
        positionsTotal: 0,
        positionsTotalHours: 0,
        positionsTotalCost: 0,
        positions: [],
        dailyTotals: [],
        dailyDetails: {},
      };
    }

    if (!vendors[item.vendorId].dailyDetails[item.date]) {
      vendors[item.vendorId].dailyDetails[item.date] = [];
    }
    vendors[item.vendorId].dailyDetails[item.date].push({
      position: item.position,
      staffTotal: item.totalStaff,
      totalHours: parseFloat(Number(item?.totalHours).toFixed(2)),
      totalCost: parseFloat(Number(item?.currentRate).toFixed(2)),
    });
  });

  return Object.values(vendors)
    .map((vendor) => {
      let missingAssetsTotal = 0;
      let missingAssetsHours = 0;
      let missingAssetsCost = 0;

      const missingAssets = Object.entries(vendor['dailyDetails']).map(
        ([date, details]) => ({
          date,
          positions: details,
          ...details.reduce(
            (totals, detail) => {
              return {
                staffTotal: totals.staffTotal + detail.staffTotal,
                totalHours: totals.totalHours + detail.totalHours,
                totalCost: totals.totalCost + detail.totalCost,
              };
            },
            {
              staffTotal: 0,
              totalHours: 0,
              totalCost: 0,
            },
          ),
        }),
      );

      missingAssets.forEach((date) => {
        missingAssetsTotal += date.staffTotal;
        missingAssetsHours += date.totalHours;
        missingAssetsCost += date.totalCost;
      });

      return {
        vendorId: vendor['vendorId'],
        vendorName: vendor['vendorName'],
        positionsTotal: vendor['positionsTotal'].toFixed(2),
        positionsTotalHours: vendor['positionsTotalHours'].toFixed(2),
        positionsTotalCost: vendor['positionsTotalCost'].toFixed(2),
        positions: vendor['positions'],
        dailyBreakdown: vendor['dailyTotals'],
        missingAssets,
        missingAssetsTotal,
        missingAssetsHours,
        missingAssetsCost,
      };
    })
    .sort((first, second) => first.vendorName.localeCompare(second.vendorName));
};

export * from './attributes';
export * from './interface';
export * from './where';
export * from './helper';
