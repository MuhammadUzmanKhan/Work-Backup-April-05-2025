/* eslint-disable max-params */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import moment from 'moment';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import {
  AuditShift,
  AuditStaff,
  Event,
  Image,
  User,
  Vendor,
  AuditNote,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  successInterceptorResponseFormat,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  CsvOrPdf,
  Options,
  PdfTypes,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { isShiftExist } from '@Modules/shift/helper';
import { bulkVendorsCreate, isVendorExist } from '@Modules/vendor/helper';
import { isVendorPositionExist } from '@Modules/vendor-position/helper';
import { VendorTypes, _ERRORS } from '@Common/constants';
import { checkIfDuplicateExist, throwCatchError } from '@Common/helpers';

import {
  commonAttributes,
  commonInclude,
  deleteEmptyShifts,
  filterShiftsDataForAggregateCards,
  formatDataForPdf,
  getAllCreatedPositions,
  getAllCreatedShifts,
  getAllPositionsCount,
  getAllStaffWhere,
  getAssetsByVendors,
  getCsvForStaffListing,
  getMultipleStaffByIdsHelper,
  getOrderOfAllStaff,
  getOrderedVsDelivered,
  getShiftsWhere,
  getStaffById,
  getStaffByIdHelper,
  isStaffExist,
  mappedAttendanceAuditData,
  saveCsv,
  sendAuditStaffClearUpdate,
  sendStaffUpdate,
  sendStaffUpdateStats,
  sendUploadStaffUpdate,
  validationsForMobileAttendance,
} from './helper';
import {
  AttendanceAuditDto,
  CreateStaffDto,
  GetStaffByEventDto,
  UploadCsvDto,
  RemoveBulkStaffDto,
  UpdateAttendanceMobileDto,
  PositionCountDto,
  ReuploadStaffDto,
  UpdateAttendanceDto,
  DownloadReportDto,
  GetStaffDetailByQrcodeDto,
  StaffIdsDto,
} from './dto';
import {
  alignedShifts,
  allCurrentRate,
  allPositionCount,
  allTotalRate,
  shiftCurrentRate,
  totalExpectedCost,
  totalExpectedHourByPosition,
  totalHourByPosition,
} from './queries';

@Injectable()
export class StaffService {
  constructor(
    private readonly httpService: HttpService,
    private readonly pusherService: PusherService,
    private sequelize: Sequelize,
  ) {}

  async createStaff(createStaffDto: CreateStaffDto, user: User) {
    const { shift_id, vendor_id, vendor_position_id } = createStaffDto;

    const shift = await isShiftExist(shift_id);
    await withCompanyScope(user, shift.event_id);
    await isVendorExist(vendor_id);
    await isVendorPositionExist(vendor_position_id);

    const staff = await AuditStaff.create({ ...createStaffDto });

    return await this.findStaffById(staff.id, { useMaster: true });
  }

  async uploadCsv(uploadCsvDto: UploadCsvDto, user: User) {
    const { csv_data, event_id, url, file_name } = uploadCsvDto;
    const [company_id] = await withCompanyScope(user, event_id);
    const staffToBeCreate = [];
    const staffWithoutShifts = [];
    let createdStaff = [];

    if (checkIfDuplicateExist(csv_data, ['start_date', 'end_date'])) {
      throw new BadRequestException(_ERRORS.DUPLICATE_SHIFT_TIMES);
    }

    const event = await isEventExist(event_id);

    const transaction = await this.sequelize.transaction();

    try {
      // it will find existing shifts, and filter csv data shifts if already existing.
      // And then create new shifts which are not already exists and returns all required ones
      const allShifts = await getAllCreatedShifts(csv_data, event, transaction);

      // This validation added for safe side if allShift array is empty or
      // if any if its sub-array is empty then we need to throw error.
      if (!allShifts.length || allShifts.every((shifts) => !shifts.length)) {
        throw new BadRequestException(_ERRORS.SHIFTS_CANNOT_BE_PROCESSED);
      }

      // it will find existing positions, and filter csv data positions if already existing.
      // And then create new positions which are not already exists and returns all required ones
      const allPositions = await getAllCreatedPositions(
        csv_data,
        company_id,
        transaction,
      );

      // get all vendors from staff list fron csv data
      const vendors = csv_data.flatMap(({ staff }) =>
        staff.map(
          ({
            vendor: name,
            // first_name,
            // last_name,
            // country_code,
            // country_iso_code,
            // cell,
            // contact_email,
          }) => ({
            // cell,
            // country_iso_code,
            // country_code,
            // contact_email,
            name,
            // contact_name: `${first_name} ${last_name}`,
            // first_name,
            // last_name,
            company_id,
            type: VendorTypes.AUDIT_VENDOR,
          }),
        ),
      );

      const allVendors = await bulkVendorsCreate(
        vendors,
        company_id,
        transaction,
      );

      // loop over csv data and assign the staff members vendor id, position id and shift id which we have already created above.
      csv_data.forEach(({ staff }) => {
        staffWithoutShifts.push(
          staff.map((singleStaff) => {
            return {
              rate: singleStaff.rate,
              pos: singleStaff.pos,
              vendor_id: allVendors.find(
                (vendor) => vendor.name === singleStaff.vendor,
              )?.id,
              vendor_position_id: allPositions.find(
                (position) => position.name === singleStaff.position,
              )?.id,
            };
          }),
        );
      });

      allShifts.forEach((shifts, index) => {
        shifts.forEach((shift) => {
          staffToBeCreate.push(
            ...staffWithoutShifts[index].map((staff) => ({
              ...staff,
              shift_id: shift.id,
            })),
          );
        });
      });

      createdStaff = await AuditStaff.bulkCreate(staffToBeCreate, {
        transaction,
      });

      await saveCsv(url, file_name, event_id, user.id, transaction);

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();

      throwCatchError(error);
    }

    sendUploadStaffUpdate(
      this.pusherService,
      event_id,
      createdStaff,
      event.time_zone,
    );

    return { message: RESPONSES.uploadedSuccessfully('Staff') };
  }

  async reuploadCsv(reuploadStaffDto: ReuploadStaffDto, user: User) {
    const { csv_data, event_id, vendor_id, url, file_name } = reuploadStaffDto;
    const [company_id] = await withCompanyScope(user, event_id);
    const staffToBeCreate = [];
    const staffWithoutShifts = [];
    let createdStaff = [];

    if (checkIfDuplicateExist(csv_data, ['start_date', 'end_date'])) {
      throw new BadRequestException(_ERRORS.DUPLICATE_SHIFT_TIMES);
    }

    await isVendorExist(vendor_id);

    const event = await isEventExist(event_id);

    const transaction = await this.sequelize.transaction();

    try {
      // first remove already existed data against vendor
      const staffIdsToDelete = (
        await AuditStaff.findAll({
          where: { vendor_id },
          attributes: ['id'],
          include: [{ model: AuditShift, where: { event_id }, attributes: [] }],
        })
      ).map((staff) => staff.id);

      await AuditStaff.destroy({
        where: { id: { [Op.in]: staffIdsToDelete } },
        transaction,
      });

      // it will find existing shifts, and filter csv data shifts if already existing.
      // And then create new shifts which are not already exists and returns all required ones
      const allShifts = await getAllCreatedShifts(csv_data, event, transaction);

      // This validation added for safe side if allShift array is empty or
      // if any if its sub-array is empty then we need to throw error.
      if (!allShifts.length || allShifts.every((shifts) => !shifts.length)) {
        throw new BadRequestException(_ERRORS.SHIFTS_CANNOT_BE_PROCESSED);
      }

      // it will find existing positions, and filter csv data positions if already existing.
      // And then create new positions which are not already exists and returns all required ones
      const allPositions = await getAllCreatedPositions(
        csv_data,
        company_id,
        transaction,
      );

      // loop over csv data and assign the staff members vendor id, position id and shift id which we have already created above.
      csv_data.forEach(({ staff }) => {
        staffWithoutShifts.push(
          staff.map((singleStaff) => {
            return {
              rate: singleStaff.rate,
              pos: singleStaff.pos,
              vendor_id,
              vendor_position_id: allPositions.find(
                (position) => position.name === singleStaff.position,
              )?.id,
            };
          }),
        );
      });

      allShifts.forEach((shifts, index) => {
        shifts.forEach((shift) => {
          staffToBeCreate.push(
            ...staffWithoutShifts[index].map((staff) => ({
              ...staff,
              shift_id: shift.id,
            })),
          );
        });
      });

      createdStaff = await AuditStaff.bulkCreate(staffToBeCreate, {
        transaction,
      });

      await saveCsv(url, file_name, event_id, user.id, transaction);

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();

      throwCatchError(error);
    }

    sendUploadStaffUpdate(
      this.pusherService,
      event_id,
      createdStaff,
      event.time_zone,
    );

    return { message: RESPONSES.uploadedSuccessfully('Staff') };
  }

  async downloadReport(
    downloadReportDto: DownloadReportDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, vendor_id, file_name, date, dates } = downloadReportDto;
    const _where = vendor_id ? { vendor_id } : {};
    let vendor: Vendor = null;

    const [company_id, , timezone] = await withCompanyScope(user, event_id);

    if (vendor_id) {
      vendor = await isVendorExist(vendor_id, company_id);
    }

    const event = await Event.findByPk(event_id, {
      attributes: [
        'name',
        'time_zone',
        [Sequelize.literal(`TO_CHAR(start_date, 'MM/DD/YYYY')`), 'start_date'],
        [Sequelize.literal(`TO_CHAR(end_date, 'MM/DD/YYYY')`), 'end_date'],
        'event_location',
      ],
      raw: true,
    });

    const positionsByVendors = await AuditStaff.findAll({
      where: { checked_in: { [Op.ne]: null }, ..._where },
      attributes: [
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalStaff',
        ],
        [Sequelize.literal('"vendor_position"."name"'), 'position'],
        [Sequelize.literal('"vendor"."name"'), 'vendorName'],
        [Sequelize.literal('"vendor"."id"'), 'vendorId'],
        totalHourByPosition,
        shiftCurrentRate,
      ],
      include: commonInclude({ event_id, date, dates }, timezone),
      group: [`"vendor_position"."id"`, `"vendor"."id"`],
      order: [
        [{ model: Vendor, as: 'vendor' }, 'name', SortBy.ASC],
        [{ model: VendorPosition, as: 'vendor_position' }, 'name', SortBy.ASC],
      ],
      raw: true,
    });

    const staffByDateAndVendor = await AuditStaff.findAll({
      where: { checked_in: { [Op.ne]: null }, ..._where },
      attributes: [
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalStaff',
        ],
        [Sequelize.literal('"vendor"."id"'), 'vendorId'],
        totalHourByPosition,
        shiftCurrentRate,
        [
          Sequelize.literal(
            `TO_CHAR(MIN("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}'), 'MM/DD/YYYY')`,
          ),
          'date',
        ],
      ],
      include: commonInclude({ event_id, date, dates }, timezone),
      group: [
        `"vendor"."id"`,
        Sequelize.literal(
          `date("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}')`,
        ),
      ],
      order: [
        [{ model: Vendor, as: 'vendor' }, 'name', SortBy.ASC],
        [
          Sequelize.literal(
            `date("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}')`,
          ),
          SortBy.ASC,
        ],
      ],
      raw: true,
    });

    const staffByDateAndPosition = await AuditStaff.findAll({
      where: { checked_in: null, ..._where },
      attributes: [
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NULL THEN 1 END)::INT',
          ),
          'totalStaff',
        ],
        [Sequelize.literal('"vendor_position"."name"'), 'position'],
        [Sequelize.literal('"vendor"."id"'), 'vendorId'],
        [Sequelize.literal('"vendor"."name"'), 'vendorName'],
        totalExpectedHourByPosition,
        totalExpectedCost,
        [
          Sequelize.literal(
            `TO_CHAR(MIN("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}'), 'MM/DD/YYYY')`,
          ),
          'date',
        ],
      ],
      include: commonInclude({ event_id, date, dates }, timezone),
      group: [
        `"vendor"."id"`,
        Sequelize.literal(
          `date("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}')`,
        ),
        `"vendor_position"."id"`,
      ],
      order: [
        [{ model: Vendor, as: 'vendor' }, 'name', SortBy.ASC],
        [
          Sequelize.literal(
            `date("shift"."start_date" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}')`,
          ),
          SortBy.ASC,
        ],
        [{ model: VendorPosition, as: 'vendor_position' }, 'name', SortBy.ASC],
      ],
      raw: true,
    });

    const vendors = formatDataForPdf(
      positionsByVendors,
      staffByDateAndVendor,
      staffByDateAndPosition,
    );

    // Api call to lambda for getting pdf
    const response = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      {
        ...event,
        vendors,
        headerText: vendor ? vendor.name.toUpperCase() : 'TOTALS',
      },
      CsvOrPdf.PDF,
      PdfTypes.AUDIT_REPORT,
      file_name,
    );

    return res.send(response.data);
  }

  async getAllStaffByEvent(
    getStaffByEventDto: GetStaffByEventDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, page, page_size, csv } = getStaffByEventDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const [, , timezone] = await withCompanyScope(user, event_id);

    const staff = await AuditStaff.findAndCountAll({
      where: getAllStaffWhere(getStaffByEventDto, timezone),
      attributes: [
        'id',
        'qr_code',
        'is_flagged',
        'pos',
        'checked_in',
        'checked_out',
        'priority',
        'deleted_at',
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
        [
          Sequelize.literal(`COALESCE(checked_out, shift.end_date)`),
          'shift_end',
        ],
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
        [
          Sequelize.literal(
            `CASE WHEN COUNT(DISTINCT "notes"."id") > 0 THEN TRUE ELSE FALSE END`,
          ),
          'isNotesExist',
        ],
        ...alignedShifts,
      ],
      include: [
        {
          model: AuditNote,
          as: 'notes',
          attributes: [],
        },
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
      order: getOrderOfAllStaff(getStaffByEventDto),
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      group: [
        `"AuditStaff"."id"`,
        `"vendor_position"."id"`,
        `"vendor_position"."name"`,
        `"vendor"."id"`,
        `"vendor"."name"`,
        `"shift"."id"`,
        `"shift"."name"`,
        `"shift"->"events"."time_zone"`,
        `"shift"."start_date"`,
        `"shift"."end_date"`,
      ],
      raw: true,
      subQuery: false,
    });

    const { rows, count } = staff;

    if (csv) {
      return await getCsvForStaffListing(rows, req, res, this.httpService);
    }

    return res.send(
      successInterceptorResponseFormat({
        data: rows,
        pagination: calculatePagination(count.length, _page_size, _page),
      }),
    );
  }

  async getAllOriginalCsvByEvent(eventId: number, user: User) {
    await withCompanyScope(user, eventId);

    const attachments = await Image.findAll({
      where: { imageable_id: eventId, imageable_type: PolymorphicType.AUDIT },
      attributes: [
        'id',
        'name',
        'url',
        'created_at',
        [Sequelize.literal(`"creator"."name"`), 'created_by'],
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: [],
        },
      ],
      order: [['created_at', SortBy.DESC]],
    });

    return attachments;
  }

  async getVendorWithShiftsAndStaffCounts(
    attendanceAuditDto: AttendanceAuditDto,
    user: User,
  ) {
    const { event_id, date } = attendanceAuditDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    const staffCountForEachShift = await AuditStaff.findAll({
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
        ...commonAttributes,
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"vendor_position"."id"`, `"vendor"."id"`, `"shift"."id"`],
      order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
      raw: true,
    });

    const staffCountForEachShiftTotal = await AuditStaff.findAll({
      attributes: [
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
        ...commonAttributes,
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"vendor"."id"`, `"shift"."id"`],
      order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
      raw: true,
    });

    const allCountsForEachVendor = await AuditStaff.findAll({
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
        allTotalRate(date, timezone, false, event_id),
        allCurrentRate,
        allPositionCount(date, timezone, false, event_id),
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"vendor"."id"`],
      raw: true,
    });

    const stats = mappedAttendanceAuditData(
      staffCountForEachShift,
      staffCountForEachShiftTotal,
      allCountsForEachVendor,
    );

    return stats;
  }

  async getVendorStats(attendanceAuditDto: AttendanceAuditDto, user: User) {
    const { event_id } = attendanceAuditDto;
    const [, , timezone] = await withCompanyScope(user, event_id);

    const assets = await AuditStaff.findAll({
      attributes: [
        [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalCheckedInCount',
        ],
        [Sequelize.literal('"vendor"."name"'), 'vendorName'],
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
      raw: true,
    });

    const allPositionCounts = await AuditStaff.findAll({
      attributes: [
        [Sequelize.literal('COUNT("AuditStaff"."id")::INT'), 'totalCount'],
        [
          Sequelize.literal(
            'COUNT(CASE WHEN "checked_in" IS NOT NULL THEN 1 END)::INT',
          ),
          'totalCheckedInCount',
        ],
        [Sequelize.literal('"vendor_position"."name"'), 'positionName'],
      ],
      include: [
        {
          model: AuditShift,
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
        {
          model: VendorPosition,
          attributes: [],
        },
      ],
      group: [`"vendor_position"."id"`],
      raw: true,
    });

    // following function will remove
    const allPositionCount = await AuditStaff.findAll({
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
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
        {
          model: VendorPosition,
          attributes: [],
        },
      ],
      group: [`"vendor_position"."id"`],
    });
    //

    const orderedVsDelivered = await AuditStaff.findAll({
      attributes: [
        [
          Sequelize.literal(
            'SUM(EXTRACT(EPOCH FROM ("shift"."end_date" - "shift"."start_date")) / 3600 * "AuditStaff"."rate")',
          ),
          'totalRate',
        ],
        shiftCurrentRate,
      ],
      include: [
        {
          model: AuditShift,
          where: getShiftsWhere(attendanceAuditDto, timezone),
          attributes: [],
        },
      ],
      group: [`"AuditStaff"."id"`],
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

    const staffCountForEachShiftTotal = await AuditStaff.findAll({
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
        shiftCurrentRate,
        [Sequelize.literal('"shift"."name"'), 'shiftName'],
        [Sequelize.literal('"shift"."id"'), 'shiftId'],
        [Sequelize.literal('"shift"."start_date"'), 'startDate'],
      ],
      include: commonInclude(attendanceAuditDto, timezone),
      group: [`"shift"."id"`],
      order: [[Sequelize.literal('"shift"."start_date"'), 'ASC']],
      raw: true,
    });

    const _orderedVsDelivered = getOrderedVsDelivered(
      orderedVsDelivered,
      totalCheckedInAssets,
      totalAssets,
    );

    const { shiftsPositionCounts, shiftsVendorCounts } =
      filterShiftsDataForAggregateCards(staffCountForEachShiftTotal);

    return {
      assets,
      totalAssets,
      totalVendors: assets.length,
      totalStaff: { totalVendors: assets.length, allPositionCount },
      orderedVsDelivered: _orderedVsDelivered,
      totalStaffDashboard: {
        all: {
          totalCount: totalAssets,
          totalCheckedInCount: totalCheckedInAssets,
          vendorCounts: assets,
          ..._orderedVsDelivered,
        },
        shifts: shiftsVendorCounts,
      },
      totalStaffPositionDashboard: {
        all: {
          totalCount: totalAssets,
          totalCheckedInCount: totalCheckedInAssets,
          positionCounts: allPositionCounts,
          ..._orderedVsDelivered,
        },
        shifts: shiftsPositionCounts,
      },
    };
  }

  async getTotalAssetsByVendor(
    attendanceAuditDto: AttendanceAuditDto,
    user: User,
  ) {
    const { event_id } = attendanceAuditDto;
    const [, , timezone] = await withCompanyScope(user, event_id);

    return await getAssetsByVendors(attendanceAuditDto, timezone);
  }

  async getAllPositionCount(positionCountDto: PositionCountDto, user: User) {
    const { event_id } = positionCountDto;
    const [, , timezone] = await withCompanyScope(user, event_id);

    return await getAllPositionsCount(positionCountDto, timezone);
  }

  async checkIfStaffExist(event_id: number) {
    const staff = await AuditStaff.findOne({
      attributes: ['id'],
      include: [
        {
          model: AuditShift,
          attributes: ['event_id'],
          where: { event_id },
        },
      ],
    });

    return !!staff;
  }

  async getDetailByQRcode(
    getStaffDetailByQrcodeDto: GetStaffDetailByQrcodeDto,
  ) {
    const { qr_code, event_id } = getStaffDetailByQrcodeDto;

    const staffs = await AuditStaff.findAll({
      where: { qr_code },
      attributes: ['id', 'checked_in', 'checked_out'],
      include: [
        {
          model: AuditShift,
          attributes: ['id', 'name', 'start_date', 'end_date'],
          where: { event_id },
        },
        {
          model: Vendor,
          attributes: ['id', 'name'],
        },
        {
          model: VendorPosition,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!staffs.length) {
      throw new NotFoundException(RESPONSES.notFound('Staffs against QR code'));
    }

    return staffs;
  }

  async findStaffById(id: number, options?: Options) {
    const staff = await AuditStaff.findByPk(id, {
      attributes: [
        'id',
        'qr_code',
        'checked_in',
        'checked_out',
        'is_flagged',
        'pos',
        [Sequelize.literal(`vendor_position.name`), 'position'],
        [Sequelize.literal(`vendor.name`), 'vendor_name'],
        [Sequelize.literal(`shift.name`), 'shift_name'],
        [Sequelize.literal(`shift.start_date`), 'start_date'],
        [Sequelize.literal(`shift.end_date`), 'end_date'],
        ...alignedShifts,
      ],
      include: [
        {
          model: AuditShift,
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
      ],
      ...options,
    });

    return staff;
  }

  async updateFlag(id: number, user: User) {
    const staff = await isStaffExist(id);

    if (staff) {
      await withCompanyScope(user, staff.shift.event_id);
    } else {
      throw new NotFoundException(RESPONSES.notFound('Staff'));
    }

    const eventId = staff.shift.event_id;

    await staff.update({ is_flagged: !staff.is_flagged });

    const _staff = await getStaffById(id, eventId, { useMaster: true });

    sendStaffUpdate(this.pusherService, _staff, eventId);

    return { message: RESPONSES.updatedSuccessfully('Flag') };
  }

  async updatePriority(id: number, user: User) {
    const staff = await isStaffExist(id);

    if (staff) {
      await withCompanyScope(user, staff.shift.event_id);
    } else {
      throw new NotFoundException(RESPONSES.notFound('Staff'));
    }

    const eventId = staff.shift.event_id;

    await staff.update({ priority: !staff.priority });

    const _staff = await getStaffById(id, eventId, { useMaster: true });

    sendStaffUpdate(this.pusherService, _staff, eventId);

    return { message: RESPONSES.updatedSuccessfully('Priority') };
  }

  async updateAttendance(
    id: number,
    updateAttendanceDto: UpdateAttendanceDto,
    user: User,
  ) {
    const { event_id, qr_code } = updateAttendanceDto;

    const time = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    const [, , timezone] = await withCompanyScope(user, event_id);

    const staff = await isStaffExist(id, event_id);
    if (!staff) {
      throw new NotFoundException(RESPONSES.notFound('Staff'));
    }

    if (!staff.checked_in) {
      if (!qr_code) throw new BadRequestException(_ERRORS.QR_CODE_REQUIRED);

      // We need to check if Qr code already assigned to a staff member.
      const alreadyStaffWithSameQr = await AuditStaff.findOne({
        where: { qr_code, shift_id: staff.shift_id },
      });

      if (alreadyStaffWithSameQr) {
        throw new BadRequestException(_ERRORS.QR_CODE_ALREADY_EXISTS);
      }

      await staff.update({
        checked_in: time,
        qr_code,
      });

      const _staff = await getStaffById(id, event_id, {
        useMaster: true,
      });

      sendStaffUpdate(this.pusherService, _staff, event_id, timezone);
      sendStaffUpdateStats(
        this.pusherService,
        event_id,
        timezone,
        _staff.vendor_id,
        _staff['expected_start_date'],
      );

      return { ..._staff, isCheckedIn: true };
    } else if (staff.checked_in && !staff.checked_out) {
      await staff.update({
        checked_out: time,
      });

      const _staff = await getStaffById(id, event_id, { useMaster: true });

      sendStaffUpdate(this.pusherService, _staff, event_id, timezone);
      sendStaffUpdateStats(
        this.pusherService,
        event_id,
        timezone,
        _staff.vendor_id,
        _staff['expected_start_date'],
      );

      return { ..._staff, isCheckedIn: false };
    }

    throw new BadRequestException(_ERRORS.STAFF_ALREADY_CHECKED_OUT);
  }

  async updateAttendanceMobile(
    updateAttendanceMobileDto: UpdateAttendanceMobileDto,
    user: User,
  ) {
    const { qr_code, vendor_id, vendor_position_id, shift_id, event_id } =
      updateAttendanceMobileDto;
    const time = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    let staff = null;

    const [, , timezone] = await withCompanyScope(user, event_id);

    await validationsForMobileAttendance(updateAttendanceMobileDto, user);

    staff = await AuditStaff.findOne({
      where: { qr_code, vendor_id, vendor_position_id, shift_id },
      attributes: ['id', 'checked_in', 'checked_out'],
    });

    if (staff) {
      if (!staff.checked_in) {
        await staff.update({
          checked_in: time,
        });
      } else if (!staff.checked_out) {
        await staff.update({
          checked_out: time,
        });
      } else {
        throw new BadRequestException(_ERRORS.STAFF_ALREADY_CHECKED_OUT);
      }
    } else {
      const alreadyStaffWithSameQr = await AuditStaff.findOne({
        where: { qr_code, shift_id },
      });

      if (alreadyStaffWithSameQr) {
        throw new BadRequestException(_ERRORS.QR_CODE_ALREADY_EXISTS);
      }

      staff = await AuditStaff.findOne({
        where: {
          vendor_id,
          vendor_position_id,
          shift_id,
          checked_in: null,
          qr_code: null,
        },
        attributes: ['id', 'checked_in', 'checked_out'],
      });

      if (staff) {
        await staff.update({
          checked_in: time,
          qr_code,
        });
      }
    }

    if (!staff) {
      throw new BadRequestException(RESPONSES.notFound('Staff'));
    }

    const staffToSend = await getStaffById(staff.id, event_id, {
      useMaster: true,
    });

    sendStaffUpdate(this.pusherService, staffToSend, event_id, timezone);
    sendStaffUpdateStats(
      this.pusherService,
      event_id,
      timezone,
      staffToSend.vendor_id,
      staffToSend['expected_start_date'],
    );

    return { message: RESPONSES.updatedSuccessfully('Attendance') };
  }

  async deleteBulkStaff(removeBulkStaffDto: RemoveBulkStaffDto, user: User) {
    const { event_id, vendor_id, shift_id } = removeBulkStaffDto;
    const where = shift_id ? { shift_id } : {};

    const [, , timezone] = await withCompanyScope(user, event_id);

    await isVendorExist(vendor_id);
    if (shift_id) await isShiftExist(shift_id);

    const staffToDelete = (
      await AuditStaff.findAll({
        where: {
          vendor_id,
          ...where,
        },
        attributes: ['id'],
        include: [
          {
            model: AuditShift,
            where: { event_id },
            attributes: [],
          },
        ],
      })
    ).map((staff) => staff.id);

    const staff = await AuditStaff.destroy({
      where: {
        id: { [Op.in]: staffToDelete },
      },
    });

    const shiftsToDelete = (
      await AuditShift.findAll({
        where: { event_id },
        attributes: ['id'],
        include: [
          {
            model: AuditStaff,
            attributes: ['id'],
          },
        ],
        useMaster: true,
      })
    )
      .filter((shift) => !shift.staff.length)
      .map((shift) => shift.id);

    await AuditShift.destroy({
      where: { id: { [Op.in]: shiftsToDelete } },
    });

    if (staff) {
      sendAuditStaffClearUpdate(
        this.pusherService,
        event_id,
        staffToDelete,
        timezone,
      );

      return { message: RESPONSES.destroyedSuccessfully('Staff') };
    }

    throw new NotFoundException(RESPONSES.notFound('Staff'));
  }

  async deleteStaff(id: number, user: User) {
    const staff = await getStaffByIdHelper(id);

    if (staff) {
      await withCompanyScope(user, staff.shift.event_id);
    } else {
      throw new NotFoundException(RESPONSES.notFound('Staff'));
    }

    // Prevent deletion if the staff member is checked in
    if (staff.checked_in) {
      throw new BadRequestException(
        _ERRORS.STAFF_CANNOT_BE_DELETED_ALREADY_CHECKED_IN,
      );
    }

    await staff.destroy();

    // Extract shift ID before deleting staff
    const shiftId = staff.shift?.id;

    await deleteEmptyShifts([shiftId], staff.shift.event_id);

    return { message: RESPONSES.destroyedSuccessfully('Staff') };
  }

  async deleteMultipleStaff(staffIdsDto: StaffIdsDto, user: User) {
    const { staff_ids } = staffIdsDto;

    // Fetch all staff in a single query
    const staffList = await getMultipleStaffByIdsHelper(staff_ids);

    const checkedInStaff = staffList.filter((staff) => staff.checked_in);

    if (checkedInStaff.length) {
      throw new BadRequestException(
        _ERRORS.STAFF_CANNOT_BE_DELETED_ALREADY_CHECKED_IN,
      );
    }

    // Extract unique shift IDs
    const shiftIds = [...new Set(staffList.map((staff) => staff.shift?.id))];

    // Validate company scope for all staff members at once
    const [, , timezone] = await withCompanyScope(
      user,
      staffList[0].shift.event_id,
    );

    // Perform bulk delete
    const deletedStaff = await AuditStaff.destroy({
      where: { id: { [Op.in]: staff_ids } },
    });

    // Check if any shifts are left without staff, and delete them
    await deleteEmptyShifts(shiftIds, staffList[0].shift.event_id);

    if (deletedStaff) {
      sendAuditStaffClearUpdate(
        this.pusherService,
        staffList[0].shift.event_id,
        staff_ids,
        timezone,
      );
    }

    return { message: RESPONSES.destroyedSuccessfully('Staff') };
  }
}
