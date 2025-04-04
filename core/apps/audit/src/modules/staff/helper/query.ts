import { Sequelize } from 'sequelize';
import {
  AuditShift,
  AuditStaff,
  Vendor,
  VendorPosition,
} from '@ontrack-tech-group/common/models';

import { AttendanceAuditDto } from '../dto';

import {
  allPositionCountAttributes,
  allPositionCountsAttriubutes,
  assetsAttributes,
  orderedVsDeliveredAttributes,
  staffCountForEachShiftTotalAttributes,
} from './attributes';

import {
  AssetForStats,
  commonInclude,
  getShiftsWhere,
  OrderedVsDelivered,
  PositionCount,
  PositionCountDetail,
} from '.';

export const assetCountsForStats = async (
  attendanceAuditDto: AttendanceAuditDto,
  timeZone: string,
): Promise<AssetForStats[]> =>
  (await AuditStaff.findAll({
    attributes: assetsAttributes,
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(attendanceAuditDto, timeZone),
        attributes: [],
      },
      {
        model: Vendor,
        attributes: [],
      },
    ],
    group: [`"vendor"."id"`],
    raw: true,
  })) as unknown as AssetForStats[];

export const allPositionCountsForStats = async (
  attendanceAuditDto: AttendanceAuditDto,
  timeZone: string,
): Promise<PositionCountDetail[]> =>
  (await AuditStaff.findAll({
    attributes: allPositionCountsAttriubutes,
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(attendanceAuditDto, timeZone),
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    group: [`"vendor_position"."id"`],
    raw: true,
  })) as unknown as PositionCountDetail[];

export const allPositionCountForStats = async (
  attendanceAuditDto: AttendanceAuditDto,
  timeZone: string,
): Promise<PositionCount[]> =>
  (await AuditStaff.findAll({
    attributes: allPositionCountAttributes,
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(attendanceAuditDto, timeZone),
        attributes: [],
      },
      {
        model: VendorPosition,
        attributes: [],
      },
    ],
    group: [`"vendor_position"."id"`],
  })) as unknown as PositionCount[];

export const orderedVsDeliveredForStats = async (
  attendanceAuditDto: AttendanceAuditDto,
  timeZone: string,
): Promise<OrderedVsDelivered> =>
  (await AuditStaff.findAll({
    attributes: orderedVsDeliveredAttributes,
    include: [
      {
        model: AuditShift,
        where: getShiftsWhere(attendanceAuditDto, timeZone),
        attributes: [],
      },
    ],
    group: [`"AuditStaff"."id"`],
    raw: true,
  })) as unknown as OrderedVsDelivered;

export const staffCountForEachShiftTotalQuery = async (
  attendanceAuditDto: AttendanceAuditDto,
  timezone: string,
  event_id: number,
): Promise<AuditStaff[]> =>
  await AuditStaff.findAll({
    attributes: staffCountForEachShiftTotalAttributes(event_id),
    include: commonInclude(attendanceAuditDto, timezone),
    group: [`"shift"."id"`],
    order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
    raw: true,
  });
