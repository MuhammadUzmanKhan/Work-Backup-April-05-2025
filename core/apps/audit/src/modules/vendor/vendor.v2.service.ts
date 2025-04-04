import { Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
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
import { shiftWhere } from '@Modules/staff/helper';
import { staffWhere } from '@Common/helpers';
import { GetAllVendorPositionsDto } from '@Modules/vendor-position/dto';
import { getAllVendorPositionsWhere } from '@Modules/vendor-position/helper';

import {
  GetAllVendorsByDatesDto,
  GetAllVendorsByShiftAndPositionDto,
  GetAllVendorsDto,
  GetVendorsByPositionDto,
} from './dto';
import { getAllVendorsWhere } from './helper';
import { GetAllVendors } from './helper/interface';
import { groupByVendor } from './helper/helper';
import {
  positionStatsByShifts,
  singleVendorStatsByShifts,
  vendorStatsByShifts,
} from './helper/query';
import { VendorShiftEnum } from './helper/enums';

@Injectable()
export class VendorV2Service {
  async getAllVendors(
    getAllVendorsDto: GetAllVendorsDto,
    user: User,
  ): Promise<GetAllVendors[]> {
    const { company_id, priority } = getAllVendorsDto;

    await getCompanyScope(user, company_id);

    const vendors = await Vendor.findAll({
      attributes: [
        'id',
        'name',
        [
          Sequelize.literal('COUNT(DISTINCT "staff"."id")::INTEGER'),
          'totalStaff',
        ],
      ],
      where: getAllVendorsWhere(getAllVendorsDto, company_id),
      include: [
        {
          model: AuditStaff,
          where: staffWhere(priority),
          as: 'staff',
          attributes: [],
        },
      ],
      group: [`"Vendor"."id"`, `"Vendor"."name"`],
    });

    return vendors as unknown as GetAllVendors[];
  }

  async getVendorsByPosition(
    getAllVendorsByPositionDto: GetVendorsByPositionDto,
  ) {
    return groupByVendor(
      await singleVendorStatsByShifts(getAllVendorsByPositionDto),
    );
  }

  async getAllVendorsByPositionAndShifts(
    getAllVendorsByShiftAndPositionDto: GetAllVendorsByShiftAndPositionDto,
    user: User,
  ) {
    const { event_id, group_by, dates, priority } =
      getAllVendorsByShiftAndPositionDto;
    const [, , timezone] = await withCompanyScope(user, event_id);

    if (group_by === VendorShiftEnum.POSITION) {
      return groupByVendor(
        await positionStatsByShifts(timezone, event_id, dates, priority),
      );
    } else {
      return groupByVendor(
        await vendorStatsByShifts(timezone, event_id, dates, priority),
      );
    }
  }

  async getVendorsByDate(
    getAllVendorsByDatesDto: GetAllVendorsByDatesDto,
    user: User,
  ) {
    const { event_id, dates } = getAllVendorsByDatesDto;

    const [company_id, , timezone] = await withCompanyScope(user, event_id);

    return await Vendor.findAll({
      attributes: [
        [
          Sequelize.literal(
            `DATE("staff->shift"."start_date" AT TIME ZONE '+00:00' AT TIME ZONE '${timezone}')`,
          ),
          'date',
        ],
        [
          Sequelize.literal(`COUNT(DISTINCT "Vendor"."id")::INTEGER`),
          'vendors',
        ],
      ],
      include: [
        {
          model: AuditStaff,
          as: 'staff',
          required: true,
          attributes: [],
          where: {
            deleted_at: null,
          },
          include: [
            {
              model: AuditShift,
              as: 'shift',
              required: true,
              attributes: [],
              where: shiftWhere({ event_id, timezone, dates }),
            },
          ],
        },
      ],
      where: {
        company_id,
      },
      group: [
        Sequelize.fn(
          'DATE',
          Sequelize.literal(
            `("staff->shift"."start_date" AT TIME ZONE '+00:00' AT TIME ZONE '${timezone}')`,
          ),
        ),
      ],
      raw: true,
    });
  }

  async getAllPositionsByVendor(
    id: number,
    getAllVendorPositionsDto: GetAllVendorPositionsDto,
    user: User,
  ): Promise<VendorPosition[]> {
    const { company_id, priority } = getAllVendorPositionsDto;

    if (company_id) await getCompanyScope(user, company_id);

    const vendor = await Vendor.findByPk(id, {
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

    if (!vendor) throw new NotFoundException('Vendor not found');

    // Ensure vendor.staff exists before calling flatMap
    if (!vendor.staff || !Array.isArray(vendor.staff)) return [];

    const vendorPositions = vendor.staff.flatMap(
      (staff) => staff.vendor_position,
    );

    if (!vendorPositions.length) return [];

    // Remove duplicates based on 'id'
    const uniqueVendorPositions = Array.from(
      new Map(vendorPositions.map((item) => [item.id, item])).values(),
    );

    return uniqueVendorPositions;
  }
}
