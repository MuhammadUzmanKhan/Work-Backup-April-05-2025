import { Op } from 'sequelize';
import { PointOfInterestType } from '@ontrack-tech-group/common/models';
import { Options } from '@ontrack-tech-group/common/constants';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying Point of Interest Type.
 */
export const getPointOfInterestTypeWhereQuery = (keyword: string) => {
  const _where = {};

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return _where;
};

export const getPointOfInterestTypeById = async (
  id: number,
  options?: Options,
) => {
  return await PointOfInterestType.findByPk(id, {
    attributes: ['id', 'name', 'color'],
    ...options,
  });
};
