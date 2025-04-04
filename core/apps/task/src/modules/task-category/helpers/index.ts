import { Op } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import { Options, RESPONSES } from '@ontrack-tech-group/common/constants';
import { TaskCategory } from '@ontrack-tech-group/common/models';

export const getTaskCategoryById = async (id: number, options?: Options) => {
  const taskCategory = await TaskCategory.findOne({
    where: { id },
    attributes: ['id', 'name', 'company_id'],
    ...options,
  });
  if (!taskCategory)
    throw new NotFoundException(RESPONSES.notFound('Task Category'));

  return taskCategory;
};

export const getTaskCategoryWhereQuery = (
  keyword: string,
  company_id: number,
) => {
  const _where = {};

  _where['company_id'] = company_id;

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  return _where;
};
