// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import { User, VendorPosition } from '@ontrack-tech-group/common/models';
import {
  getCompanyScope,
  isCompanyExist,
} from '@ontrack-tech-group/common/helpers';
import { RESPONSES } from '@ontrack-tech-group/common/constants';

import {
  CreateVendorPositionDto,
  GetAllVendorPositionsByEventDto,
} from '../dto';

export const isVendorPositionUnique = async (
  name: string,
  company_id: number,
) => {
  const vendorPosition = await VendorPosition.findOne({
    where: {
      name,
      company_id: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: company_id }] },
    },
  });

  if (vendorPosition)
    throw new ConflictException(
      RESPONSES.alreadyExist('Vendor Position With Same Name'),
    );
};

export const checkVendorPositionValidations = async (
  createVendorPositionDto: CreateVendorPositionDto,
  user: User,
) => {
  const { name, company_id } = createVendorPositionDto;

  await getCompanyScope(user, company_id);

  await isCompanyExist(company_id);

  await isVendorPositionUnique(name, company_id);
};

export const getAllVendorPositionsByEventWhere = (
  getAllVendorPositionsByEventDto: GetAllVendorPositionsByEventDto,
) => {
  const { keyword } = getAllVendorPositionsByEventDto;
  const where = {};

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return where;
};

export const isVendorPositionExist = async (id: number) => {
  const vendorPosition = await VendorPosition.findByPk(id, {
    attributes: ['id', 'name', 'company_id'],
  });

  if (!vendorPosition)
    throw new NotFoundException(RESPONSES.notFound('Vendor Position'));

  return vendorPosition;
};

export const bulkPositionsCreate = async (
  positions: string[],
  company_id: number,
  transaction: Transaction,
) => {
  let newlyCreatedPositions = [];

  const alreadyExistPositions = await VendorPosition.findAll({
    where: {
      [Op.or]: positions.map((position) => ({
        name: {
          [Op.iLike]: position.toLowerCase(),
        },
      })),
      company_id: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: company_id }] },
    },
    attributes: ['id', 'name', 'company_id'],
    raw: true,
  });

  const positionsToBeCreate = positions.filter((position) => {
    return !alreadyExistPositions.some(
      (existingPosition) => position === existingPosition.name,
    );
  });

  if (positionsToBeCreate.length) {
    newlyCreatedPositions = (
      await VendorPosition.bulkCreate(
        positionsToBeCreate.map((position) => ({ name: position, company_id })),
        {
          transaction,
        },
      )
    ).map((position) => position.get({ plain: true }));
  }

  return [...newlyCreatedPositions, ...alreadyExistPositions];
};

export const isPositionExist = async (
  position_id: number,
): Promise<VendorPosition> => {
  const position = VendorPosition.findByPk(position_id);

  if (!position)
    throw new NotFoundException(RESPONSES.notFound('Vendor Position'));

  return position;
};

export * from './where';
export * from './interface';
