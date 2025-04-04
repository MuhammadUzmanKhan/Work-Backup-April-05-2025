import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  AssignedAvailableQueryParamsDto,
  InventoryTypeQueryParamsDto,
} from '../dto';

export const getInventoryTypeWhereQuery = (
  filters: InventoryTypeQueryParamsDto | AssignedAvailableQueryParamsDto,
  company_id: number,
) => {
  const _where = {};
  const { inventory_type_category_id } = filters;

  if (inventory_type_category_id)
    _where['inventory_type_category_id'] = inventory_type_category_id;

  if (filters['department_id'])
    _where['department_id'] = filters['department_id'];

  if (company_id) _where['company_id'] = company_id;

  if (filters['has_image_or_comment']) {
    _where[Op.and] = [
      Sequelize.literal(`EXISTS (
      SELECT 1 FROM "images" 
      WHERE "images"."imageable_id" = "InventoryType"."id" AND "images"."imageable_type" = 'InventoryType'
    )`),
    ];
  }

  return _where;
};
