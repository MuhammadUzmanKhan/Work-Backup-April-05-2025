import { Injectable } from '@nestjs/common';
import {
  AuditShift,
  AuditStaff,
  User,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import {
  getCompanyScope,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { SortBy } from '@ontrack-tech-group/common/constants';

import {
  CreateVendorPositionDto,
  GetAllVendorPositionsByEventDto,
  GetAllVendorPositionsDto,
} from './dto';
import {
  checkVendorPositionValidations,
  getAllVendorPositionsByEventWhere,
} from './helper';
import { getAllVendorPositionsWhere } from './helper/where';

@Injectable()
export class VendorPositionService {
  async createVendorPosition(
    createVendorPositionDto: CreateVendorPositionDto,
    user: User,
  ) {
    await checkVendorPositionValidations(createVendorPositionDto, user);

    const vendorPosition = await VendorPosition.create({
      ...createVendorPositionDto,
    });

    return vendorPosition;
  }

  async getAllVendorPositions(
    getAllVendorPositionsDto: GetAllVendorPositionsDto,
    user: User,
  ) {
    const { company_id } = getAllVendorPositionsDto;

    if (company_id) {
      await getCompanyScope(user, company_id);
    }

    return await VendorPosition.findAll({
      where: getAllVendorPositionsWhere(getAllVendorPositionsDto),
      attributes: ['id', 'name', 'company_id'],
      order: [['name', SortBy.ASC]],
    });
  }

  async getAllVendorPositionsByEvent(
    getAllVendorPositionsByEventDto: GetAllVendorPositionsByEventDto,
    user: User,
  ) {
    const { event_id, vendor_id } = getAllVendorPositionsByEventDto;

    await withCompanyScope(user, event_id);

    return await VendorPosition.findAll({
      where: getAllVendorPositionsByEventWhere(getAllVendorPositionsByEventDto),
      attributes: ['id', 'name', 'company_id'],
      include: [
        {
          model: AuditStaff,
          where: vendor_id ? { vendor_id } : {},
          attributes: [],
          required: true,
          include: [
            {
              model: AuditShift,
              where: { event_id },
              attributes: [],
            },
          ],
        },
      ],
      order: [['name', SortBy.ASC]],
    });
  }
}
