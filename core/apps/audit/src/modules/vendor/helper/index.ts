// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { Vendor } from '@ontrack-tech-group/common/models';
import { makeUniqueArrayOfObjects } from '@Common/helpers';

import { GetAllVendorsDto } from '../dto';

export const isUniqueVendor = async (name: string, company_id: number) => {
  const vendor = await Vendor.findOne({
    where: {
      name: {
        [Op.iLike]: name.toLowerCase(),
      },
      company_id,
    },
  });

  if (vendor) throw new ConflictException(RESPONSES.alreadyExist('Vendor'));
};

export const getAllVendorsWhere = (
  getAllVendorsDto: GetAllVendorsDto,
  company_id: number,
) => {
  const { keyword } = getAllVendorsDto;
  const where = { company_id };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return where;
};

export const isVendorExist = async (id: number, company_id?: number) => {
  const vendor = await Vendor.findOne({
    where: { id, ...(company_id ? { company_id } : {}) },
    attributes: ['id', 'name', 'company_id', 'type'],
  });

  if (!vendor) throw new NotFoundException(RESPONSES.notFound('Vendor'));

  return vendor;
};

export const bulkVendorsCreate = async (
  vendors,
  company_id: number,
  transaction: Transaction,
) => {
  let newlyCreatedVendors = [];

  const alreadyExistVendors = await Vendor.findAll({
    where: {
      [Op.or]: vendors.map((vendor) => ({
        name: {
          [Op.iLike]: vendor.name.toLowerCase(),
        },
      })),
      company_id,
    },
    attributes: ['id', 'name', 'company_id'],
    raw: true,
  });

  const uniqueVendors = makeUniqueArrayOfObjects(vendors, [
    'name',
    'company_id',
  ]);

  const vendorsToBeCreate = uniqueVendors.filter((vendor) => {
    return !alreadyExistVendors.some(
      (existingVendor) =>
        vendor.name.toLowerCase() === existingVendor.name.toLowerCase(),
    );
  });

  if (vendorsToBeCreate.length) {
    newlyCreatedVendors = (
      await Vendor.bulkCreate(vendorsToBeCreate, {
        transaction,
      })
    ).map((vendor) => vendor.get({ plain: true }));
  }

  /////// Update existing vendor data

  // const vendorsToBeUpdate = uniqueVendors.filter((vendor) => {
  //   return alreadyExistVendors.some(
  //     (existingVendor) =>
  //       vendor.name.toLowerCase() === existingVendor.name.toLowerCase(),
  //   );
  // });

  // for (let i = 0; i < vendorsToBeUpdate.length; i++) {
  //   const {
  //     cell,
  //     // country_iso_code,
  //     country_code,
  //     contact_email,
  //     contact_name,
  //     first_name,
  //     last_name,
  //     company_id,
  //     name,
  //   } = vendorsToBeUpdate[i];

  //   await Vendor.update(
  //     {
  //       cell,
  //       country_iso_code,
  //       country_code,
  //       contact_email,
  //       contact_name,
  //       first_name,
  //       last_name,
  //     },
  //     {
  //       where: {
  //         company_id,
  //         name: {
  //           [Op.like]: name,
  //         },
  //       },
  //       transaction,
  //     },
  //   );
  // }

  ////////

  return [...newlyCreatedVendors, ...alreadyExistVendors];
};

export const isVendorListExist = async (ids: number[]) => {
  if (ids?.length) {
    const vendorCount = await Vendor.count({ where: { id: { [Op.in]: ids } } });

    if (vendorCount !== ids.length)
      throw new NotFoundException(RESPONSES.notFound('Some Of Vendors'));
  }
};

export const vendorCommonAttributes = [
  'id',
  'name',
  'contact_name',
  'first_name',
  'last_name',
  'contact_email',
  'color',
  'note',
  'type',
  'company_id',
  'cell',
  'country_iso_code',
  'country_code',
];
