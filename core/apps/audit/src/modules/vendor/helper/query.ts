import { Sequelize } from 'sequelize';
import { AuditShift, VendorPosition } from '@ontrack-tech-group/common/models';
import { shiftWhere } from '@Modules/staff/helper';

import { GetVendorsByPositionDto } from '../dto';

import { StatsForShift } from './interface';
import {
  vendorPositionStatsByShiftsInclude,
  vendorStatsByShiftsInclude,
  vendorStatsByShiftsWithPositionInclude,
} from './include';
import {
  vendorPositionStatsByShiftsAttributes,
  vendorStatsByShiftsAttributes,
} from './attributes';

export const positionStatsByShifts = async (
  timezone: string,
  event_id: number,
  dates?: string[],
  priority?: boolean,
) => {
  return (await VendorPosition.findAll({
    include: vendorPositionStatsByShiftsInclude(
      timezone,
      event_id,
      dates,
      priority,
    ),
    attributes: vendorPositionStatsByShiftsAttributes,
    group: [
      `"VendorPosition"."id"`,
      `"staff"."shift"."id"`,
      `"staff"."shift"."name"`,
    ], // Group data properly
    raw: true, // Flatten nested data
    order: [[Sequelize.literal(`"staff->shift"."start_date"`), 'ASC']],
  })) as unknown as StatsForShift[];
};

export const vendorStatsByShifts = async (
  timezone: string,
  event_id: number,
  dates?: string[],
  priority?: boolean,
) => {
  return (await AuditShift.findAll({
    where: shiftWhere({ event_id, dates, timezone }),
    include: vendorStatsByShiftsInclude(priority),
    attributes: vendorStatsByShiftsAttributes,
    group: [
      `"AuditShift"."id"`,
      `"staff"."vendor"."id"`,
      `"staff"."vendor"."name"`,
    ], // Group data properly
    raw: true, // Flatten nested data
    order: [[Sequelize.literal(`"AuditShift"."start_date"`), 'ASC']],
  })) as unknown as StatsForShift[];
};

export const singleVendorStatsByShifts = async ({
  event_id,
  position_id,
  vendor_id,
  dates,
}: GetVendorsByPositionDto) => {
  return (await AuditShift.findAll({
    where: shiftWhere({ event_id, dates }),
    include: vendorStatsByShiftsWithPositionInclude(position_id, vendor_id),
    attributes: vendorStatsByShiftsAttributes,
    group: [
      `"AuditShift"."id"`,
      `"staff"."vendor"."id"`,
      `"staff"."vendor"."name"`,
    ], // Group data properly
    raw: true, // Flatten nested data
  })) as unknown as StatsForShift[];
};
