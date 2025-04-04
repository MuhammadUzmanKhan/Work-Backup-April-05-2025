/* eslint-disable complexity */
import { Order, Sequelize, WhereOptions } from 'sequelize';
import { Injectable } from '@nestjs/common';
import {
  AuditShift,
  AuditStaff,
  User,
  Vendor,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import {
  getCompanyScope,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { shiftWhere } from '@Modules/staff/helper';
import { staffWhere } from '@Common/helpers';

import { GetAllVendorPositionsDto } from './dto';
import { getAllVendorPositionsWhere } from './helper';
import { GetPositionDataQueryParamsDto } from './dto/get-position-table-data';
import {
  CHECKED_OUT,
  CURRENT_CHECKED_IN_STAFF,
  TOTAL_CHECKED_IN_PERCENTAGE,
  TOTAL_CHECKED_IN_STAFF,
  TOTAL_CHECKED_OUT_PERCENTAGE,
  TOTAL_STAFF_COUNT,
} from './helper/constants';
import { positionDetailsDataOrder } from './helper/order';
import { PositionDataEnum } from './helper/enums';

@Injectable()
export class VendorPositionV2Service {
  async getAllVendorPositions(
    getAllVendorPositionsDto: GetAllVendorPositionsDto,
    user: User,
  ): Promise<{ id: number; name: string; positions: VendorPosition[] }[]> {
    const { company_id, priority } = getAllVendorPositionsDto;

    if (company_id) await getCompanyScope(user, company_id);

    const vendors = await Vendor.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: AuditStaff,
          as: 'staff',
          where: staffWhere(priority),
          attributes: ['id'],
          include: [
            {
              model: VendorPosition,
              where: getAllVendorPositionsWhere(getAllVendorPositionsDto),
              attributes: ['id', 'name', 'company_id'],
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    return vendors.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      positions: Array.from(
        new Map(
          vendor.staff
            .flatMap((staff) => staff.vendor_position)
            .map((pos) => [pos.id, pos]),
        ).values(),
      ),
    }));
  }

  async getVendorPositionListingStats(
    getPositionDataQueryParamsDto: GetPositionDataQueryParamsDto,
    user: User,
  ) {
    const { vendor_id, shift_id, sort_by, order, event_id, dates, priority } =
      getPositionDataQueryParamsDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    const vendorWhere: WhereOptions = {};

    if (vendor_id) vendorWhere['id'] = vendor_id;

    let orderBy!: Order;

    if (sort_by) {
      orderBy = positionDetailsDataOrder(
        sort_by as PositionDataEnum,
        (order || SortBy.ASC) as SortBy,
      );
    }

    return await VendorPosition.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.col('"staff"."vendor_id"'), 'vendor_id'],
        [Sequelize.col('"staff->vendor"."name"'), 'vendor_name'],
        [Sequelize.literal(TOTAL_STAFF_COUNT), 'totalOrder'],
        [Sequelize.literal(TOTAL_CHECKED_IN_STAFF), 'totalCheckedInStaff'],
        [Sequelize.literal(CURRENT_CHECKED_IN_STAFF), 'currentCheckedInStaff'],
        [Sequelize.literal(CHECKED_OUT), 'checkedOut'],
        [
          Sequelize.literal(TOTAL_CHECKED_IN_PERCENTAGE),
          'totalCheckedInPercentage',
        ],
        [
          Sequelize.literal(TOTAL_CHECKED_OUT_PERCENTAGE),
          'totalCheckedOutPercentage',
        ],
      ],
      include: [
        {
          model: AuditStaff,
          as: 'staff',
          required: true,
          attributes: [],
          where: staffWhere(priority),
          include: [
            {
              model: Vendor,
              required: true,
              where: vendorWhere,
              attributes: [],
            },
            {
              model: AuditShift,
              as: 'shift',
              where: shiftWhere({ event_id, dates, id: shift_id, timezone }),
              attributes: [],
            },
          ],
        },
      ],
      group: [
        `"VendorPosition"."id"`,
        `"staff"."vendor_id"`,
        `"staff->vendor"."name"`,
      ],
      raw: true,
      order: orderBy,
    });
  }
}
