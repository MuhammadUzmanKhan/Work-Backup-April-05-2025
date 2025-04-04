import { Op } from 'sequelize';

export const getAllListWhere = (
  listedTaskIds: number[],
  filteredListId: number,
  event_id: number,
) => {
  const where = { event_id };

  if (listedTaskIds.length) {
    where['id'] = { [Op.notIn]: listedTaskIds };
  }

  if (filteredListId) {
    where['id'] = filteredListId;
  }

  return where;
};
