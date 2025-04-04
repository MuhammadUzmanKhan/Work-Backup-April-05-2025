import moment from 'moment-timezone';
import { Model, Op, Sequelize, Transaction } from 'sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  getQueryListParam,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  PusherChannels,
  PusherEvents,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  Area,
  DotMapDot,
  DotMapShift,
  DotMapVendor,
  DotShift,
  Position,
  PositionName,
  User,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ShiftService } from '@Modules/shift/shift.service';
import { isVendorExist } from '@Modules/vendor/helper';
import { isAreaExist } from '@Modules/area/helpers';
import { isPositionExist } from '@Modules/position/helpers';
import {
  bulkCreateWithCheck,
  calculateTotalShiftHours,
  formatShiftName,
} from '@Common/helpers';
import { CreateShift, WithOldDataDotSockets } from '@Common/constants';
import { getAllShiftsHelperForCopy } from '@Modules/shift/helpers';
import {
  CopyDotDto,
  DotDto,
  GetDotsByEventDto,
  ResetDeploymentDto,
  SwapDotsDto,
  UpdateBulkDotsDto,
  UpdateDotDto,
  UpdateShiftDto,
  UploadDotsDto,
} from '../dto';

export const getAllCreatedShifts = async (
  uploadDotsDto: UploadDotsDto | SwapDotsDto,
  timezone: string,
  transaction: Transaction,
  shiftService: ShiftService,
) => {
  const { event_id, dots } = uploadDotsDto;

  // Create a list of shifts with formatted dates
  const shifts = dots.flatMap((dot: DotDto) =>
    dot.shifts.map(({ start_date, end_date, rate, quantity }) => {
      const formattedStartDate = start_date.split('Z')[0] + '.000Z';
      const formattedEndDate = end_date.split('Z')[0] + '.000Z';

      return {
        event_id,
        rate,
        quantity,
        name: formatShiftName(formattedStartDate, timezone),
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        pos_id: dot.pos_id,
      };
    }),
  );

  // it will find existing shifts, and filter csv data shifts if already existing.
  // And then create new shifts which are not already exists and returns all required ones
  return await shiftService.bulkShiftsCreate(shifts, transaction);
};

// Generic function to handle bulk creation of positions, position names, areas, and vendors
const getAllCreatedEntities = async <T extends Model>(
  dots: DotDto[],
  companyId: number,
  transaction: Transaction,
  key: keyof DotDto,
  model: { new (): T } & typeof Model,
): Promise<T[]> => {
  // Extract the specified key from dots and get unique values
  const uniqueEntities = [...new Set(dots.map((dot) => dot[key]))];

  // Use the service to bulk create the unique entities
  const createdEntities = await bulkCreateWithCheck(
    model,
    uniqueEntities as string[],
    companyId,
    transaction,
  );

  return createdEntities as T[];
};

export const getCreatedAssociations = async (
  uploadDotsDto: UploadDotsDto | SwapDotsDto,
  user: User,
  transaction: Transaction,
  shiftService: ShiftService,
) => {
  const { dots, event_id } = uploadDotsDto;
  const [companyId, , timezone] = await withCompanyScope(user, event_id);

  // it will find existing shifts, and filter csv data shifts if already existing.
  // And then create new shifts which are not already exists and returns all required ones
  const allShifts = await getAllCreatedShifts(
    uploadDotsDto,
    timezone,
    transaction,
    shiftService,
  );

  // it will find existing positions, and filter csv data positions if already existing.
  // And then create new positions which are not already exists and returns all required ones
  const allPositions = await getAllCreatedEntities(
    dots,
    companyId,
    transaction,
    'position',
    Position,
  );

  // it will find existing position names, and filter csv data position names if already existing.
  // And then create new position names which are not already exists and returns all required ones
  const allPositionNames = await getAllCreatedEntities(
    dots,
    companyId,
    transaction,
    'position_name',
    PositionName,
  );

  // it will find existing areas, and filter csv data areas if already existing.
  // And then create new areas which are not already exists and returns all required ones
  const allAreas = await getAllCreatedEntities(
    dots,
    companyId,
    transaction,
    'area',
    Area,
  );

  // it will find existing vendors, and filter csv data vendors if already existing.
  // And then create new vendors which are not already exists and returns all required ones
  const allVendors = await getAllCreatedEntities(
    dots,
    companyId,
    transaction,
    'vendor',
    DotMapVendor,
  );

  return { allAreas, allPositionNames, allPositions, allShifts, allVendors };
};

export const getAllDotsWhere = (getDotsByEventDto: GetDotsByEventDto) => {
  const {
    event_id,
    vendor_ids,
    area_ids,
    position_ids,
    position_name_ids,
    shift_ids,
    keyword,
    priority,
    placed,
    missing,
    dates,
  } = getDotsByEventDto;
  const where = { event_id };

  // converting dates into array
  const filterDates = getQueryListParam(dates);

  const vendorIds = getQueryListParam(vendor_ids);
  const areaIds = getQueryListParam(area_ids);
  const positionIds = getQueryListParam(position_ids);
  const positionNameIds = getQueryListParam(position_name_ids);
  const shiftIds = getQueryListParam(shift_ids);

  if (vendorIds?.length) where['$"vendor"."id"$'] = { [Op.in]: vendorIds };

  if (areaIds?.length) where['$"area"."id"$'] = { [Op.in]: areaIds };

  if (positionIds?.length)
    where['$"position"."id"$'] = { [Op.in]: positionIds };

  if (positionNameIds?.length)
    where['$"position_name"."id"$'] = { [Op.in]: positionNameIds };

  if (shiftIds?.length) where['$"shifts"."id"$'] = { [Op.in]: shiftIds };

  if (priority) where['priority'] = priority;

  if (placed !== undefined) where['placed'] = placed;

  if (missing !== undefined) where['missing'] = missing;

  // This means the database will filter rows where the start_date falls within the specified time range for any of the provided dates.
  // getting data on the base of selected dates wihtin the shifts
  if (filterDates?.length) {
    where[Op.or] = filterDates.map((day: string) => {
      const [startDate, endDate] = [
        moment.utc(day).startOf('day').toISOString(),
        moment.utc(day).endOf('day').toISOString(),
      ];

      return {
        '$"shifts"."start_date"$': {
          [Op.between]: [startDate, endDate],
        },
      };
    });
  }

  if (keyword) {
    if (!where[Op.and]) where[Op.and] = [];

    where[Op.and].push({
      [Op.or]: [
        { pos_id: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { '$vendor.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$area.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        {
          '$position.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        {
          '$position_name.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` },
        },
        {
          '$shifts.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
      ],
    });
  }

  return where;
};

/**
 * Generates an array of new dots with sequential `pos_id`s based on the highest
 * existing `pos_id` with the same prefix within the same event.
 *
 * This function takes a `DotMapDot` object, extracts the prefix from its `pos_id`,
 * and queries the database to find the highest `pos_id` with the same prefix and
 * `event_id`. It then increments the numeric part of the `pos_id` to create a new,
 * unique `pos_id` for each cloned dot. If no existing `pos_id` with the same prefix
 * is found, it starts from `prefix-001`. The function returns an array of dot objects
 * with incremented `pos_id`s based on the specified quantity.
 *
 * @param {DotMapDot} dot - The dot object containing the `pos_id` and `event_id`.
 * @param {number} quantity - The number of new dots to generate.
 * @returns {Promise<string>} The new `pos_id` with an incremented numeric value.
 */
export const newBulkDots = async (dots: DotMapDot[], quantity: number) => {
  const newDots = [];
  const lastPosIdMap = new Map<string, string>(); // Track the last `pos_id` for each prefix

  for (const dot of dots) {
    const currentPosId = dot['pos_id'].split('-CL-')[0];

    let lastPosId = lastPosIdMap.get(currentPosId);

    if (!lastPosId) {
      const highestClonedPosId = await DotMapDot.findOne({
        attributes: [
          [Sequelize.fn('MAX', Sequelize.col('pos_id')), 'maxPosId'],
        ],
        where: {
          pos_id: {
            [Op.like]: `${currentPosId}-%`,
          },
          event_id: dot.event_id,
        },
        raw: true,
      });

      if (highestClonedPosId && highestClonedPosId['maxPosId']) {
        const maxPosIdNumStr = highestClonedPosId['maxPosId'].split('-CL-')[1];
        const maxPosIdNum = parseInt(maxPosIdNumStr, 10);
        const numLength = maxPosIdNumStr.length;

        lastPosId = `${currentPosId}-CL-${String(maxPosIdNum + 1).padStart(numLength, '0')}`;
      } else {
        lastPosId = `${currentPosId}-CL-001`;
      }

      lastPosIdMap.set(currentPosId, lastPosId); // Initialize tracking for this prefix
    }

    for (let i = 0; i < quantity; i++) {
      newDots.push({
        ...dot,
        pos_id: lastPosId,
        addition: true,
      });

      // Increment the pos_id for the next dot
      const lastPosIdNumStr = lastPosId.split('-CL-')[1];
      const lastPosIdNum = parseInt(lastPosIdNumStr, 10);
      const numLength = lastPosIdNumStr.length;

      lastPosId = `${currentPosId}-CL-${String(lastPosIdNum + 1).padStart(numLength, '0')}`;
      lastPosIdMap.set(currentPosId, lastPosId); // Update the lastPosIdMap
    }
  }

  return newDots;
};

export const allDotsExist = async (ids: number[]) => {
  const dots = await DotMapDot.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'event_id', 'vendor_id', 'position_id', 'area_id'],
  });

  if (ids.length !== dots.length)
    throw new NotFoundException(RESPONSES.notFound('Some of Dots'));

  return dots;
};

export const isDotExist = async (id: number) => {
  const dot = await DotMapDot.findByPk(id, {
    attributes: ['id', 'event_id', 'vendor_id', 'position_id', 'area_id'],
  });

  if (!dot) throw new NotFoundException(RESPONSES.notFound('Dot'));

  return dot;
};

export const checkUpdateDotValidations = async (
  updateBulkDotsDto: UpdateBulkDotsDto | UpdateDotDto,
  dotIds: number[],
) => {
  const { area_id, position_id, vendor_id, shifts } = updateBulkDotsDto;
  const shiftIds = [];
  const dotShiftIds = [];

  if (vendor_id) await isVendorExist(vendor_id);
  if (area_id) await isAreaExist(area_id);
  if (position_id) await isPositionExist(position_id);

  if (shifts?.length) {
    for (const dotShift of shifts) {
      if (dotShift.dot_shift_id) dotShiftIds.push(dotShift.dot_shift_id);
      if (dotShift.shift_id) shiftIds.push(dotShift.shift_id);
    }

    // Fetch all dotShifts that were already existing in db
    const dotShifts = await DotShift.findAll({
      where: { dot_id: { [Op.in]: dotIds } },
      attributes: ['id', 'shift_id', 'rate', 'staff'],
      raw: true,
    });

    // Filter the dot shifts that has been sent in dto to check if all dot shifts sent exist in db.
    const filteredDotShifts = dotShifts.filter((dotShift) =>
      dotShiftIds.includes(dotShift.id),
    );

    if (filteredDotShifts.length !== dotShiftIds.length)
      throw new BadRequestException(
        RESPONSES.notFound('Some of dot shift ids'),
      );

    const _shifts = await DotMapShift.findAll({
      where: { id: { [Op.in]: shiftIds } },
      attributes: ['id', 'start_date', 'end_date'],
      raw: true,
    });

    return {
      dotShifts,
      shifts: shiftIds.map((id) => _shifts.find((shift) => shift.id === id)),
    };
  }

  return { dotShifts: [], shifts: [] };
};

export const checkBulkUpdateDotValidations = async (
  updateBulkDotsDto: UpdateBulkDotsDto,
  dates: string[],
  timezone: string,
  event_id: number,
) => {
  const { area_id, position_id, vendor_id, shifts } = updateBulkDotsDto;

  await Promise.all([
    vendor_id && isVendorExist(vendor_id),
    area_id && isAreaExist(area_id),
    position_id && isPositionExist(position_id),
  ]);

  if (!shifts?.length) return { shifts: [] };

  const shiftIds = shifts.map((dotShift) => dotShift.shift_id).filter(Boolean);

  const _shifts = await DotMapShift.findAll({
    where: { id: { [Op.in]: shiftIds } },
    attributes: ['id', 'start_date', 'end_date'],
    raw: true,
  });

  if (!dates?.length) {
    return { shifts: _shifts.filter((shift) => shiftIds.includes(shift.id)) };
  }

  // Generate and check new shifts
  const newShifts = generateNewShifts(_shifts, dates, timezone, event_id);
  const existingShifts = await getAllShiftsHelperForCopy(newShifts);
  const existingShiftsSet = new Set(
    existingShifts.map(
      (shift) =>
        `${shift.start_date.toISOString()}-${shift.end_date.toISOString()}`,
    ),
  );

  const shiftsToBeCreated = newShifts.filter(
    ({ start_date, end_date }) =>
      !existingShiftsSet.has(`${start_date}-${end_date}`) &&
      existingShiftsSet.add(`${start_date}-${end_date}`),
  );

  return {
    shiftsToBeCreated,
    existingShifts,
    shifts: _shifts.filter((shift) => shiftIds.includes(shift.id)),
  };
};

const processCreateShifts = async (
  toCreateShifts: DotShift[],
  transaction: Transaction,
) => {
  //  Fetch all potential existing shifts in bulk
  const existingShifts = await DotShift.findAll({
    where: {
      [Op.or]: toCreateShifts.map((shift) => ({
        dot_id: shift.dot_id,
        shift_id: shift.shift_id,
        rate: shift.rate,
      })),
    },
  });

  // Create a lookup map for existing shifts
  const existingShiftsMap = new Map(
    existingShifts.map((shift) => {
      const key = `${shift.dot_id}-${shift.shift_id}-${shift.rate}`;
      return [key, shift];
    }),
  );

  //  Separate new shifts from updates
  const shiftsToUpdateStaff = [];
  const newDotShifts = [];

  for (const shift of toCreateShifts) {
    const key = `${shift.dot_id}-${shift.shift_id}-${shift.rate}`;
    const existingShift = existingShiftsMap.get(key);

    if (existingShift) {
      // Update the staff count for existing shifts
      existingShift.staff += 1;
      shiftsToUpdateStaff.push(existingShift);
    } else {
      // Prepare new shifts for creation
      newDotShifts.push(shift);
    }
  }

  // Perform bulk updates and creations
  if (shiftsToUpdateStaff.length) {
    await Promise.all(
      shiftsToUpdateStaff.map((shift) => shift.save({ transaction })),
    );
  }

  if (newDotShifts.length) {
    await DotShift.bulkCreate(newDotShifts, { transaction });
  }
};

export const sendDotsSocketUpdates = (
  data: WithOldDataDotSockets,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${event_id}`,
    [PusherEvents.DOT],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

export const sendResetSocketUpdates = (
  vendor_id: number,
  event_id: number,
  pusherService: PusherService,
) => {
  const message = vendor_id
    ? 'Deployment has been reset for the selected vendor.'
    : 'Deployment has been fully reset for the event.';

  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${event_id}`,
    [PusherEvents.DOT_RESET],
    {
      message,
    },
  );
};

export const sendPriorityMissingCountUpdates = async (
  event_id: number,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${event_id}`,
    [PusherEvents.DOT_COUNT],
    await getPriorityAndMissingDotsCount(event_id),
  );
};

export const sendCopyDotUpdate = async (
  event_id: number,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${event_id}`,
    [PusherEvents.COPY_DOT],
    { message: 'Copy Dots' },
  );
};

export const dotsResponseForClone = async (ids: number[]) => {
  return await DotMapDot.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: {
      exclude: commonExcludeAttributes,
      include: commonIncludeAttributes,
    },
    include: commonIncludes,
    group: commonGroupBy,
    order: [['placed', SortBy.ASC]],
    useMaster: true,
  });
};

export const createOrUpdateDotShifts = async (
  dot_id: number,
  updateDotDto: UpdateDotDto,
  dotShifts: DotShift[],
  transaction: Transaction,
) => {
  const { shifts } = updateDotDto;

  let toUpdateShifts = [];
  let toCreateShifts = [];
  const toDeleteShifts = [];

  if (!shifts?.length)
    return { toCreateShifts, toUpdateShifts, toDeleteShifts };

  for (const shift of shifts) {
    if (shift.dot_shift_id) toUpdateShifts.push(shift);
    else toCreateShifts.push({ ...shift, dot_id });
  }

  for (const dotShift of dotShifts) {
    if (!toUpdateShifts.find((shift) => shift.dot_shift_id === dotShift.id))
      toDeleteShifts.push(dotShift.id);
  }

  const { matchedShifts, unmatchedToCreateShifts } = findAndUpdateMatchedShifts(
    dotShifts,
    toCreateShifts,
    toUpdateShifts,
    toDeleteShifts,
  );

  toUpdateShifts = Array.from(
    new Map(
      [...matchedShifts, ...toUpdateShifts].map((obj) => [
        obj.dot_shift_id,
        obj,
      ]),
    ).values(),
  );

  toCreateShifts = unmatchedToCreateShifts;

  // Update existing shifts
  if (toUpdateShifts.length) {
    await Promise.all(
      toUpdateShifts.map((shift) =>
        DotShift.update(shift, {
          where: { id: shift.dot_shift_id },
          transaction,
        }),
      ),
    );
  }

  // Create new shifts, checking for duplicates
  // if shifts already exist, then updating the staff count
  if (toCreateShifts.length)
    await processCreateShifts(toCreateShifts, transaction);

  if (toDeleteShifts.length) {
    await DotShift.destroy({
      where: { id: { [Op.in]: toDeleteShifts } },
      transaction,
    });
  }

  return { toCreateShifts, toUpdateShifts, toDeleteShifts };
};

export const findAndUpdateMatchedShifts = (
  dotShifts: DotShift[],
  toCreateShifts: CreateShift[],
  updatedDotShifts: UpdateShiftDto[],
  toDeleteShifts: number[],
) => {
  // Create a map for fast lookup based on rate and shift_id
  const dotShiftsMap = new Map();
  const dotShiftsMapToUpdate = new Map();

  // Array to hold matched and updated shifts
  const matchedShifts = [];
  const unmatchedToCreateShifts = [];

  dotShifts
    .filter((shift) => !toDeleteShifts.includes(shift.id))
    .forEach((shift) => {
      const key = `${shift.rate}|${shift.shift_id}`;
      dotShiftsMap.set(key, shift);
    });

  updatedDotShifts.forEach((shift) => {
    const key = `${shift.rate}|${shift.shift_id}`;
    dotShiftsMapToUpdate.set(key, shift);
  });

  // Loop through toCreateShifts and update the matched shifts
  toCreateShifts.forEach((toCreate) => {
    const key = `${toCreate.rate}|${toCreate.shift_id}`;

    if (dotShiftsMap.has(key) && dotShiftsMapToUpdate.has(key)) {
      const matchedShift = dotShiftsMapToUpdate.get(key);
      matchedShift.staff += toCreate.staff; // Update staff count
      matchedShifts.push(matchedShift); // Add to matched shifts
    } else {
      unmatchedToCreateShifts.push(toCreate); // Add to unmatched toCreateShifts
    }
  });

  return { matchedShifts, unmatchedToCreateShifts };
};

/**
 * This function fetch all the existing dot shifts objects in array. Then it loops each existing object.
 * In loop it finds if we have any updated dot shifts then it will get staff from existing and merge that with update dot shift object.
 * In loop it also adding rate and staff for all dot shifts objects.
 * And after loop it calculates rate and staff again for newly added shifts.
 * @param dot_id
 * @param updatedDotShifts
 * @param createdDotShifts
 * @returns total rate and avg rate of a dot
 */
export const getTotalAvgRateOfDot = async (
  updatedDotShifts: UpdateShiftDto[],
  createdDotShifts: CreateShift[],
  deletedDotShifts: number[],
  dotShifts: DotShift[],
) => {
  let totalRate = 0;
  let totalStaff = 0;

  for (const dotShift of dotShifts) {
    // find updated shift
    const updatedShift = updatedDotShifts.find(
      (_shift) => _shift.dot_shift_id === dotShift.id,
    ) as unknown as DotShift;

    // We need to skip those shifts which we are deleting. So they will not be part of the update calculations
    if (deletedDotShifts.includes(updatedShift?.id) || !updatedShift) {
      continue;
    }

    totalRate += updatedShift.rate * updatedShift.staff;
    totalStaff += updatedShift.staff;
  }

  // Include newly created shifts if any
  if (createdDotShifts.length > 0) {
    for (const shift of createdDotShifts) {
      totalRate += shift.rate * shift.staff;
      totalStaff += shift.staff;
    }
  }

  const avgRate = parseFloat((totalRate / totalStaff).toFixed(2));

  return { totalRate, avgRate };
};

export const getTotalAvgRateOfBulkDot = async (
  createdDotShifts: UpdateShiftDto[],
) => {
  let totalRate = 0;
  let totalStaff = 0;

  // Include newly created shifts if any
  for (const shift of createdDotShifts) {
    totalRate += shift.rate * shift.staff;
    totalStaff += shift.staff;
  }

  const avgRate = parseFloat((totalRate / totalStaff).toFixed(2));

  return { totalRate, avgRate };
};

export const getPriorityAndMissingDotsCount = async (event_id: number) => {
  const dots = await DotMapDot.findAll({
    where: { event_id },
    attributes: ['id', 'missing', 'priority'],
  });

  const missingDotsCount = dots.filter((dot) => dot.missing).length;

  const priorityDotsCount = dots.filter((dot) => dot.priority).length;

  return { missingDotsCount, priorityDotsCount };
};

export async function fetchDots(
  resetDeploymentDto: ResetDeploymentDto,
): Promise<DotMapDot[]> {
  // Find dots based on event_id and optional vendor_id
  const { event_id, vendor_id } = resetDeploymentDto;

  const dots = await DotMapDot.findAll({
    attributes: ['id'],
    where: {
      event_id,
      ...(vendor_id && { vendor_id }),
    },
    include: [
      {
        model: DotShift,
        as: 'dot_shifts',
        attributes: ['id', 'shift_id'],
      },
    ],
  });

  if (!dots.length) throw new NotFoundException(RESPONSES.notFound('Dots'));

  return dots;
}

export const copyDotHelper = async (
  dots: DotMapDot[],
  copyDotDto: CopyDotDto,
  timezone: string,
) => {
  const { dates, event_id } = copyDotDto;

  // Fetching unique Shifts which are associated with multiple dots
  const uniqueShifts = Array.from(
    dots
      .flatMap(({ shifts }) => shifts)
      .reduce((acc, shift) => {
        const compositeKey = `${shift.id}-${shift['dot_id']}-${shift['rate']}`;
        if (!acc.has(compositeKey)) acc.set(compositeKey, shift);
        return acc;
      }, new Map())
      .values(),
  );

  // Generate new shifts
  const newShifts = generateNewShifts(uniqueShifts, dates, timezone, event_id);

  // Fetch existing shifts in bulk
  const existingShifts = await getAllShiftsHelperForCopy(newShifts);

  const existingShiftsSet = new Set(
    existingShifts.map(
      (shift) =>
        `${shift['dot_id']}-${shift.start_date.toISOString()}-${shift.end_date.toISOString()}-${shift['rate']}`,
    ),
  );

  // Filter out duplicate shifts
  const shiftsToBeCreated = newShifts.filter((shift) => {
    const key = `${shift['dot_id']}-${shift.start_date}-${shift.end_date}-${shift['rate']}`;

    if (!existingShiftsSet.has(key)) {
      existingShiftsSet.add(key);
      return true;
    }

    return false;
  });

  const uniqueShiftsMap = new Map();

  const dotShiftAssociations = shiftsToBeCreated.map((shift) => {
    const shiftKey = `${shift.start_date}-${shift.end_date}`;
    if (!uniqueShiftsMap.has(shiftKey)) {
      uniqueShiftsMap.set(shiftKey, {
        event_id: shift.event_id,
        shift_id: shift.shift_id,
        name: shift.name,
        start_date: shift.start_date,
        end_date: shift.end_date,
      });
    }

    return {
      dot_id: shift.dot_id,
      rate: shift.rate,
      staff: 1,
      start_date: shift.start_date,
      end_date: shift.end_date,
    };
  });

  const uniqueShiftsToBeCreated = Array.from(uniqueShiftsMap.values());

  return {
    uniqueShiftsToBeCreated,
    existingShifts,
    dotShiftAssociations,
  };
};

export const bulkCreateDotsHelper = async (
  uploadDotsDto: SwapDotsDto | UploadDotsDto,
  user: User,
  transaction: Transaction,
  shiftService: ShiftService,
) => {
  const { dots, event_id } = uploadDotsDto;
  const dotsToBeCreate = [];

  const { allAreas, allPositionNames, allPositions, allShifts, allVendors } =
    await getCreatedAssociations(
      uploadDotsDto,
      user,
      transaction,
      shiftService,
    );

  // loop over csv data and assign the dots vendor id, position id, position name id, area id, shifts etc which we have already created above.
  dots.forEach((dot) => {
    const shifts = allShifts[`${dot.pos_id}`];

    const { totalRate, totalStaff } = shifts.reduce(
      (acc, { rate, quantity }) => {
        acc.totalRate += rate * quantity;
        acc.totalStaff += quantity;
        return acc;
      },
      { totalRate: 0, totalStaff: 0 },
    );

    dotsToBeCreate.push({
      ...dot,
      event_id,
      vendor_id: allVendors.find(
        (vendor) => vendor.name.toLowerCase() === dot.vendor.toLowerCase(),
      )?.id,
      position_id: allPositions.find(
        (position) =>
          position.name.toLowerCase() === dot.position.toLowerCase(),
      )?.id,
      position_name_id: allPositionNames.find(
        (positionName) =>
          positionName.name.toLowerCase() === dot.position_name.toLowerCase(),
      )?.id,
      area_id: allAreas.find(
        (area) => area.name.toLowerCase() === dot.area.toLowerCase(),
      )?.id,
      base: uploadDotsDto['base_deployment'] || false,
      total_shift_hours: calculateTotalShiftHours(allShifts[`${dot.pos_id}`]),
      dot_shifts: allShifts[`${dot.pos_id}`].map(({ id, rate, quantity }) => ({
        rate,
        shift_id: id,
        staff: quantity,
      })),
      total_rate: totalRate,
      avg_rate: parseFloat((totalRate / totalStaff).toFixed(2)),
    });
  });

  return dotsToBeCreate;
};

// This function generates new shifts according to the dates.
export const generateNewShifts = (
  uniqueShifts: DotMapShift[],
  dates: string[],
  timezone: string,
  event_id: number,
) => {
  return uniqueShifts.flatMap((shift) => {
    // Dates received from the input specifying which dates the data with dots should be copied to.
    return dates.map((date) => {
      const startTime = moment
        .tz(shift['start_date'], timezone)
        .format('HH:mm:ss.SSS');

      const endTime = moment
        .tz(shift['end_date'], timezone)
        .format('HH:mm:ss.SSS');

      const formattedStartDate = `${date}T${startTime}`;
      const formattedEndDate = `${date}T${endTime}`;

      // Adjust end date if it spans across two days
      // Convert concatenated dates into UTC
      const startDateTime = moment.tz(formattedStartDate, timezone).utc();
      let endDateTime = moment.tz(formattedEndDate, timezone).utc();

      if (endDateTime.isBefore(startDateTime)) {
        endDateTime = endDateTime.add(1, 'day');
      }

      return {
        event_id,
        shift_id: shift['id'],
        rate: shift['rate'],
        dot_id: shift['dot_id'],
        name: formatShiftName(startDateTime.toISOString(), timezone),
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
      };
    });
  });
};

export const commonIncludeAttributes: any = [
  [Sequelize.literal(`"DotMapDot"."id"`), 'id'],
  [Sequelize.literal(`vendor.color`), 'vendor_color'],
  [
    Sequelize.literal(`
      json_agg(
        DISTINCT jsonb_build_object(
          'id', "shifts"."id",
          'name', "shifts"."name",
          'start_date', to_char("shifts"."start_date" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'end_date', to_char("shifts"."end_date" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'rate', "shifts->DotShift"."rate",
          'dot_shift_id', "shifts->DotShift"."id",
          'staff', "shifts->DotShift"."staff",
          'dot_id', "shifts->DotShift"."dot_id"
        )
      )
    `),
    'dot_shifts',
  ],
  [
    Sequelize.literal(`SUM("shifts->DotShift"."staff")::INTEGER`),
    'total_staff',
  ],
];

export const commonExcludeAttributes: any = [
  'updatedAt',
  'createdAt',
  'deletedAt',
  'vendor_id',
  'area_id',
  'position_id',
  'position_name_id',
];

export const commonIncludes = [
  { model: DotMapShift, attributes: [], through: { attributes: [] } },
  {
    model: DotMapVendor,
    attributes: ['id', 'name', 'color'],
  },
  {
    model: Position,
    attributes: ['id', 'name'],
  },
  {
    model: PositionName,
    attributes: ['id', 'name'],
  },
  {
    model: Area,
    attributes: ['id', 'name'],
  },
];

export const commonGroupBy = [
  `"vendor"."id"`,
  `"DotMapDot"."id`,
  `"area"."id"`,
  `"position"."id"`,
  `"position_name"."id"`,
];
