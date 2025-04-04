import moment from 'moment-timezone';
import { Op } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import {
  CsvOrPdf,
  Options,
  PdfTypes,
  PusherChannels,
  PusherEvents,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import {
  DotMapDot,
  DotMapShift,
  DotMapVendor,
  DotShift,
  Position,
} from '@ontrack-tech-group/common/models';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { commonEventCheckInclude } from '@Common/helpers';
import { BudgetSummaryPosition, VendorSockets } from '@Common/constants';
import { budgetSummaryWhere } from './where';

export const getVendorsListByEvent = async (
  eventId: number,
  options?: Options,
) => {
  return await DotMapVendor.findAll({
    attributes: ['id', 'name', 'color'],
    include: commonEventCheckInclude(eventId),
    ...options,
  });
};

export const isVendorExist = async (id: number) => {
  const vendor = await DotMapVendor.findByPk(id, {
    attributes: ['id', 'company_id'],
  });

  if (!vendor) throw new NotFoundException(RESPONSES.notFound('Vendor'));

  return vendor;
};

export const areAllVendorsExist = async (ids: number[], company_id: number) => {
  const vendors = await DotMapVendor.findAll({
    attributes: ['id', 'name', 'color', 'company_id'],
    where: { id: { [Op.in]: ids }, company_id },
    raw: true,
  });

  if (vendors.length !== ids.length)
    throw new NotFoundException(RESPONSES.notFound('Some Of Vendors'));

  return vendors;
};

const sortPositions = (
  positionMap: Record<string, BudgetSummaryPosition>,
): BudgetSummaryPosition[] =>
  Object.values(positionMap).sort((a, b) =>
    a.position.localeCompare(b.position),
  );

export const sendVendorSocketUpdates = (
  data: VendorSockets,
  companyId: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${companyId}`,
    [PusherEvents.VENDOR],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

export const formatBudgetSummary = (
  data: DotMapVendor[],
  additions: DotMapVendor[],
  removals: DotMapVendor[],
) => {
  // Preprocess additions and removals into maps for quick lookup so it will save loops to find vendors from
  const additionsMap = additions.reduce((map, vendor) => {
    map[vendor.id] = vendor.dots || [];
    return map;
  }, {});

  const removalsMap = removals.reduce((map, vendor) => {
    map[vendor.id] = vendor.dots || [];
    return map;
  }, {});

  const groupedData = data.map(({ id, name, color, dots }) => {
    const positionMap = {};
    let totalDots = 0;
    let totalRate = 0;
    let totalStaff = 0;
    let totalAvgRate = 0;
    let totalPositions = 0;

    dots.forEach((dot) => {
      // get total staff against a dot
      const staff = dot.dot_shifts.reduce(
        (agg, dotShift) => (agg += dotShift.staff),
        0,
      );
      const positionName = dot.position.name;

      if (!positionMap[positionName]) {
        // Initialize new position entry if it does not exist
        positionMap[positionName] = {
          staff: 0,
          position: positionName,
          dotCount: 0,
          avgRate: 0,
          totalRate: 0,
          totalHours: 0,
        };
      }

      // Update existing position entry
      positionMap[positionName].staff += staff;
      positionMap[positionName].dotCount += 1;
      positionMap[positionName].totalRate += dot.total_rate;
      positionMap[positionName].avgRate += dot.avg_rate;
      positionMap[positionName].totalHours += dot.total_shift_hours;

      totalDots += 1;
      totalRate += dot.total_rate;
      totalStaff += staff;
    });

    // Calculate avgRate for each position
    Object.values(positionMap).forEach((position) => {
      position['avgRate'] = parseFloat(
        (position['avgRate'] / position['dotCount']).toFixed(2),
      );

      totalAvgRate += position['avgRate'];
      totalPositions += 1;
      position['totalRate'] = +position['totalRate'].toFixed(2);
    });

    const additionDots = additionsMap[id] || [];
    const removalDots = removalsMap[id] || [];

    return {
      id,
      name,
      color,
      totalDots,
      totalStaff,
      totalRate: +totalRate.toFixed(2),
      avgRate: parseFloat((totalAvgRate / totalPositions).toFixed(2)),
      positions: sortPositions(positionMap),
      addition: {
        total: additionDots.length,
        cost: additionDots.reduce((agg, dot) => (agg += dot.total_rate), 0),
      },
      removal: {
        total: removalDots.length,
        cost: removalDots.reduce((agg, dot) => (agg += dot.total_rate), 0),
      },
    };
  });

  // Calculate overall totals in a single reduce
  const {
    vendorTotals,
    additionTotal,
    additionCost,
    removalTotal,
    removalCost,
    totalDots,
    totalRate,
  } = groupedData.reduce(
    (acc, vendor) => {
      acc.vendorTotals.push({
        name: vendor.name,
        color: vendor.color,
        totalDots: vendor.totalDots,
        totalStaff: vendor.totalStaff,
        avgRate: vendor.avgRate,
        totalRate: vendor.totalRate,
      });

      acc.additionTotal += vendor.addition.total;
      acc.additionCost += vendor.addition.cost;
      acc.removalTotal += vendor.removal.total;
      acc.removalCost += vendor.removal.cost;
      acc.totalDots += vendor.totalDots;
      acc.totalRate += vendor.totalRate;

      return acc;
    },
    {
      vendorTotals: [],
      additionTotal: 0,
      additionCost: 0,
      removalTotal: 0,
      removalCost: 0,
      totalDots: 0,
      totalRate: 0,
    },
  );

  // Create the final summary including the vendor totals and the overall additions/removals
  const totals = {
    totalDots,
    totalRate: +totalRate.toFixed(2),
    vendors: vendorTotals,
    addition: {
      total: additionTotal,
      cost: additionCost,
    },
    removal: {
      total: removalTotal,
      cost: removalCost,
    },
  };

  // Create the totals by position
  const positionTotalsMap = {};
  const positionVendorCount = {}; // Map to track number of unique vendors per position

  groupedData.forEach((vendor) => {
    vendor.positions.forEach((position) => {
      if (!positionTotalsMap[position.position]) {
        positionTotalsMap[position.position] = {
          staff: 0,
          position: position.position,
          dotCount: 0,
          avgRate: 0,
          totalRate: 0,
          totalHours: 0,
        };
        positionVendorCount[position.position] = new Set(); // Initialize with a new Set to track unique vendors
      }
      positionTotalsMap[position.position].staff += position.staff;
      positionTotalsMap[position.position].dotCount += position.dotCount;
      positionTotalsMap[position.position].totalRate += Number(
        position.totalRate.toFixed(2),
      );
      positionTotalsMap[position.position].totalHours += position.totalHours;
      positionTotalsMap[position.position].avgRate += Number(
        position.avgRate.toFixed(2),
      );
      positionVendorCount[position.position].add(vendor.id); // Add current vendor's ID to set
    });
  });

  // Finalize the avgRate for each position
  Object.values(positionTotalsMap).forEach(
    (position: BudgetSummaryPosition) => {
      const vendorCount = positionVendorCount[position.position].size; // Get the number of unique vendors
      position.avgRate = parseFloat(
        (position.avgRate / vendorCount).toFixed(2),
      );
    },
  );

  // convert map to array
  const allPositionsData: BudgetSummaryPosition[] = (
    Object.values(positionTotalsMap) as BudgetSummaryPosition[]
  ).map((position: BudgetSummaryPosition) => ({
    ...position,
    totalRate: Number(position.totalRate.toFixed(2)),
  }));

  // total rate by sum of all totals for by position
  const _totalRate = allPositionsData.reduce(
    (sum, pos) => (sum += pos.totalRate),
    0,
  );

  // total hours by sum of all hours for by position
  const _totalHours = allPositionsData.reduce(
    (sum, pos) => (sum += pos.totalHours),
    0,
  );

  const totalsByPosition = {
    totalDots: allPositionsData.reduce((sum, pos) => (sum += pos.dotCount), 0),
    totalRate: +_totalRate.toFixed(2),
    totalHours: _totalHours,
    hourlyEstimate: parseFloat((_totalRate / _totalHours).toFixed(2)),
    positions: allPositionsData.sort((a, b) =>
      a.position.localeCompare(b.position),
    ),
  };

  return { totals, vendors: groupedData, totalsByPosition };
};

export const budgetSummaryhelper = async (
  event_id: number,
  options?: Options,
  dates?: Date[],
) => {
  // total dots by each vendor
  const vendors = await DotMapVendor.findAll({
    where: budgetSummaryWhere(dates),
    attributes: ['id', 'name', 'color'],
    include: [
      {
        model: DotMapDot,
        where: { event_id },
        attributes: ['id', 'avg_rate', 'total_rate', 'total_shift_hours'],
        include: [
          {
            model: Position,
            attributes: ['id', 'name'],
          },
          { model: DotShift, attributes: ['staff'] },
          {
            model: DotMapShift,
            attributes: [],
          },
        ],
      },
    ],
    group: [
      `"DotMapVendor"."id"`,
      `"dots->position"."id"`,
      `"dots"."id"`,
      `"dots->dot_shifts"."id"`,
      `"dots->shifts->DotShift"."id"`,
    ],
    ...options,
  });

  // total addition dots by each vendor
  const additionDotsByVendor = await DotMapVendor.findAll({
    where: budgetSummaryWhere(dates),
    attributes: ['id'],
    include: [
      {
        model: DotMapDot,
        where: { event_id, addition: true },
        attributes: ['id', 'total_rate'],
        include: [
          {
            model: DotMapShift,
            attributes: [],
          },
        ],
      },
    ],
    group: [
      `"DotMapVendor"."id"`,
      `"dots"."id"`,
      `"dots->shifts->DotShift"."id"`,
    ],
    ...options,
  });

  // total removal dots by each vendor
  const deletedDotsByVendor = await DotMapVendor.findAll({
    attributes: ['id'],
    include: [
      {
        model: DotMapDot,
        where: { event_id, deleted_at: { [Op.ne]: null } },
        attributes: ['id', 'total_rate'],
        paranoid: false,
        include: [
          {
            model: DotMapShift,
            attributes: [],
          },
        ],
      },
    ],
    group: [
      `"DotMapVendor"."id"`,
      `"dots"."id"`,
      `"dots->shifts->DotShift"."id"`,
    ],
    ...options,
  });

  return formatBudgetSummary(
    vendors,
    additionDotsByVendor,
    deletedDotsByVendor,
  );
};

export const sendBudgetSummarySocket = (
  data,
  eventId: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.DOTMAP_CHANNEL}-${eventId}`,
    [PusherEvents.BUDGET_SUMMARY],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

/**
 * This function gets array of timestamps and convert that it specific format of months dates - year.
 * If dates are in multiple months or year. It will stack the text accordingly
 * @param shifts Array of shifts start dates in timestamp format
 * @returns It returns formatted coverage text, total days and months
 */
export const formatCoverage = (shifts: Date[]) => {
  // Create a map to store dates and their corresponding formatted strings
  const dateMap = new Map();

  // Prepare the formatted output and calculate the total number of unique days
  let formattedOutput = '';
  let totalDays = 0;
  let months = 0;

  // Iterate over each timestamp
  shifts.forEach((shift) => {
    const date = new Date(shift);

    // Extract the month, day, and year
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();

    // Create a key for the date (e.g., "August - 2024")
    const key = `${month} - ${year}`;

    // Add the day to the corresponding date entry in the map
    if (!dateMap.has(key)) {
      dateMap.set(key, new Set());
    }
    dateMap.get(key).add(day);
  });

  const dateMapArray = Array.from(dateMap); // Convert dateMap to an array

  dateMapArray.forEach((daysSetEntry, index) => {
    const [key, daysSet] = daysSetEntry; // Destructure the array entry
    const [month, year] = key.split(' - ');
    const daysArray = Array.from(daysSet);
    const daysString = daysArray.join(', ');

    formattedOutput += `${month} ${daysString} - ${year}`;

    // Add a newline character only if this is not the last element
    if (index < dateMapArray.length - 1) {
      formattedOutput += '\n';
    }

    totalDays += daysSet.size;
    months += 1;
  });

  // Return the formatted output with the total number of unique days
  return { text: formattedOutput.replace(/\n/g, '<br>'), totalDays, months };
};

export const generatePdfHelper = async (
  data: any,
  req: Request,
  res: Response,
  httpService: HttpService,
  filename: string,
  type: PdfTypes,
) => {
  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    data,
    CsvOrPdf.PDF,
    type,
    filename,
  );

  return res.send(response.data);
};
