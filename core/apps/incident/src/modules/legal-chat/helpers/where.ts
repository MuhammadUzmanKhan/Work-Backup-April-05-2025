import { Op, WhereOptions } from 'sequelize';

export function getLegalChatWhereClause(
  legal_group_id: number,
  keyword?: string,
): WhereOptions {
  const where = {};

  if (legal_group_id) {
    where['legal_group_id'] = legal_group_id;
  }

  if (keyword) {
    where['message'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return where;
}
