import { Op, WhereOptions } from 'sequelize';

import { GetAllVendorPositionsDto } from '../dto';

export const getAllVendorPositionsWhere = (
  getAllVendorPositionsDto: GetAllVendorPositionsDto,
): WhereOptions => {
  const { keyword, company_id } = getAllVendorPositionsDto;
  const where: WhereOptions = {};

  if (keyword) where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  if (company_id) {
    where['company_id'] = {
      [Op.or]: [{ [Op.is]: null }, { [Op.eq]: company_id }],
    };
  } else {
    where['company_id'] = { [Op.is]: null };
  }

  return where;
};
