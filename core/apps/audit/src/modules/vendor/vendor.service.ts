import { Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  AuditShift,
  AuditStaff,
  User,
  Vendor,
} from '@ontrack-tech-group/common/models';
import {
  getCompanyScope,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { Options, RESPONSES } from '@ontrack-tech-group/common/constants';
import { VendorTypes } from '@Common/constants';

import {
  CreateVendorDto,
  GetAllVendorsByEventDto,
  GetAllVendorsDto,
} from './dto';
import {
  getAllVendorsWhere,
  isUniqueVendor,
  vendorCommonAttributes,
} from './helper';

@Injectable()
export class VendorService {
  async createVendor(createVendorDto: CreateVendorDto, user: User) {
    const { company_id, name, first_name, last_name } = createVendorDto;

    await getCompanyScope(user, company_id);

    await isUniqueVendor(name, company_id);

    const vendor = await Vendor.create({
      ...createVendorDto,
      contact_name: `${first_name} ${last_name}`,
      company_id,
      type: VendorTypes.AUDIT_VENDOR,
    });

    return await this.getVendorById(vendor.id, user, { useMaster: true });
  }

  async getAllVendors(getAllVendorsDto: GetAllVendorsDto, user: User) {
    const { company_id } = getAllVendorsDto;

    await getCompanyScope(user, company_id);

    const vendors = await Vendor.findAll({
      where: getAllVendorsWhere(getAllVendorsDto, company_id),
      attributes: vendorCommonAttributes,
    });

    return vendors;
  }

  async getAllVendorsByEvent(
    getAllVendorsByEventDto: GetAllVendorsByEventDto,
    user: User,
  ) {
    const { event_id, keyword } = getAllVendorsByEventDto;

    await withCompanyScope(user, event_id);

    const vendors = await Vendor.findAll({
      where: keyword
        ? { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } }
        : {},
      attributes: vendorCommonAttributes,
      include: [
        {
          model: AuditStaff,
          attributes: [],
          include: [
            {
              model: AuditShift,
              where: { event_id },
              attributes: [],
            },
          ],
          required: true,
        },
      ],
    });

    return vendors;
  }

  async getVendorById(id: number, user: User, options?: Options) {
    const vendor = await Vendor.findByPk(id, {
      attributes: vendorCommonAttributes,
      ...options,
    });

    if (vendor) {
      await getCompanyScope(user, vendor.company_id);
    }

    if (!vendor) throw new NotFoundException(RESPONSES.notFound('Vendor'));

    return vendor;
  }
}
