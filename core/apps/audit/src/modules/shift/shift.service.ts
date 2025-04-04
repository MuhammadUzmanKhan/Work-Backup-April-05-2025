// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Op, WhereOptions } from 'sequelize';
import {
  AuditShift,
  AuditStaff,
  User,
  Vendor,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSizeWithDefault,
  isEventExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { destroyStaffByShiftId } from '@Modules/staff/helper';
import { alignedShifts } from '@Modules/staff/queries';
import { isVendorExist } from '@Modules/vendor/helper';
import { getStartEndUtcDates } from '@Common/helpers';

import {
  CreateShiftDto,
  GetAllShiftsDto,
  GetShiftByIdDto,
  UpdateShiftDto,
} from './dto';
import {
  getAllShiftsWhere,
  getOrderOfAllShifts,
  getOrderOfAllStaff,
  getShiftByIdHelper,
  getShiftByIdSubqueries,
  getShiftByIdWhere,
  getShiftDates,
  isShiftExist,
} from './helper';

@Injectable()
export class ShiftService {
  constructor(private sequelize: Sequelize) {}

  async createShift(createShiftDto: CreateShiftDto, user: User) {
    const { event_id, start_dates, end_dates } = createShiftDto;
    const bulkCreateShifts = [];

    await withCompanyScope(user, event_id);

    for (let int = 0; int < start_dates.length; int++) {
      const start_date = start_dates[int];
      const end_date = end_dates[int];

      bulkCreateShifts.push({
        ...createShiftDto,
        start_date,
        end_date,
      });
    }

    const shifts = await AuditShift.bulkCreate(bulkCreateShifts);

    if (shifts.length > 1) {
      return { message: RESPONSES.createdSuccessfully('Recurring Shifts') };
    }

    return shifts;
  }

  async getAllShifts(getAllShiftsDto: GetAllShiftsDto, user: User) {
    const { event_id, vendor_id, vendor_position_id } = getAllShiftsDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    if (vendor_id) await isVendorExist(vendor_id);

    return await AuditShift.findAll({
      where: getAllShiftsWhere(getAllShiftsDto, timezone),
      attributes: {
        exclude: ['updatedAt'],
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT("staff"."id")::INTEGER FROM "audit"."staff" AS "staff" WHERE "staff"."shift_id" = "AuditShift"."id")`,
            ),
            'workers',
          ],
        ],
      },
      include:
        vendor_id || vendor_position_id
          ? [
              {
                model: AuditStaff,
                where: {
                  ...(vendor_id ? { vendor_id } : {}),
                  ...(vendor_position_id ? { vendor_position_id } : {}),
                },
                attributes: [],
              },
            ]
          : [],
      order: getOrderOfAllShifts(getAllShiftsDto),
    });
  }

  async getShiftsOfCurrentDay(eventId: number, user: User) {
    await withCompanyScope(user, eventId);

    const { startDate, endDate } = getStartEndUtcDates();

    return await AuditShift.findAll({
      where: { start_date: { [Op.between]: [startDate, endDate] } },
      attributes: {
        exclude: ['updatedAt'],
      },
      include: [
        {
          model: AuditStaff,
          attributes: [],
          required: true,
        },
      ],
      order: [['start_date', SortBy.ASC]],
    });
  }

  async getAllShiftDates(event_id: number, user: User) {
    await withCompanyScope(user, event_id);

    const event = await isEventExist(event_id);

    const shiftDates = await getShiftDates(event_id, event.time_zone);

    return [...new Set(shiftDates)];
  }

  async getAllShiftsRates(getAllShiftRates: GetAllShiftRates, user: User) {
    const { event_id, vendor_id } = getAllShiftRates;

    await withCompanyScope(user, event_id);

    const _where: WhereOptions = {};

    _where['id'] = vendor_id;

    return await AuditStaff.findAll({
      attributes: ['rate'],
      include: [
        {
          model: AuditShift,
          where: { event_id },
          attributes: [],
        },
        {
          model: Vendor,
          where: _where,
          attributes: [],
        },
      ],
      order: [['rate', 'ASC']],
      group: [`"AuditStaff"."rate"`],
    });
  }

  async getShiftById(id: number, user: User, getShiftByIdDto: GetShiftByIdDto) {
    const { page, page_size } = getShiftByIdDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const _shift = await isShiftExist(id);
    await withCompanyScope(user, _shift.event_id);

    const shift = await AuditShift.findOne({
      where: { id },
      attributes: {
        exclude: ['updatedAt'],
        include: [...getShiftByIdSubqueries(getShiftByIdDto)],
      },
      raw: true,
    });

    const staff = await AuditStaff.findAndCountAll({
      where: { shift_id: id, ...getShiftByIdWhere(getShiftByIdDto) },
      attributes: [
        'id',
        'qr_code',
        'checked_in',
        'checked_out',
        'is_flagged',
        'pos',
        [Sequelize.literal(`"vendor_position"."name"`), 'position'],
        [Sequelize.literal(`"vendor"."name"`), 'vendor_name'],
        [Sequelize.literal(`"vendor"."contact_email"`), 'vendor_email'],
        [Sequelize.literal(`"vendor"."cell"`), 'vendor_cell'],
        [Sequelize.literal(`"vendor"."country_code"`), 'vendor_country_code'],
        ...alignedShifts,
      ],
      include: [
        {
          model: Vendor,
          attributes: [],
        },
        {
          model: VendorPosition,
          attributes: [],
        },
      ],
      order: getOrderOfAllStaff(getShiftByIdDto),
      limit: _page_size,
      offset: _page_size * _page,
    });

    const { rows, count } = staff;

    // As data is not array so we can send pagination in pagination property
    // so that is why sending in counts property as we can send any thing in counts.
    return {
      data: { ...shift, staff: rows },
      counts: calculatePagination(count, _page_size, _page),
    };
  }

  async updateShift(id: number, updateShiftDto: UpdateShiftDto, user: User) {
    const shift = await isShiftExist(id);

    await withCompanyScope(user, shift.event_id);

    return await shift.update({ ...updateShiftDto });
  }

  async deleteShift(id: number, user: User) {
    const shift = await getShiftByIdHelper(id);

    if (shift) {
      await withCompanyScope(user, shift.event_id);
    } else throw new NotFoundException(RESPONSES.notFound('Shift'));

    const transaction = await this.sequelize.transaction();

    try {
      await shift.destroy({ transaction });

      await destroyStaffByShiftId(id, transaction);

      await transaction.commit();
      return {
        message: RESPONSES.destroyedSuccessfully('Shift'),
      };
    } catch (error) {
      await transaction.rollback();
      // eslint-disable-next-line no-console
      console.log(error);
      throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
    }
  }
}
