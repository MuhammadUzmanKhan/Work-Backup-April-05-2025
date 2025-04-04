import { Op } from 'sequelize';
import { PolymorphicType } from '../../../constants';
import { GetChangeLogDto } from '../dto';

export const changeLogsWhere = (getChangeLogs: GetChangeLogDto) => {
  const _where = {};
  const { id, types } = getChangeLogs;

  if (types.includes(PolymorphicType.USER)) {
    _where['column'] = { [Op.ne]: 'location' };
  }

  _where['change_logable_id'] = id;

  _where['change_logable_type'] = { [Op.in]: types };

  return _where;
};
