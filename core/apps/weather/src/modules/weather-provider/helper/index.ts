import { Op } from 'sequelize';

export const getAllWeatherProviderWhere = (keyword: string) => {
  const _where = {};

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  return _where;
};
