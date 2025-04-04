import { Op, Sequelize } from 'sequelize';
import {
  GlobalIncident,
  IncidentType,
  UserMessageConfig,
} from '@ontrack-tech-group/common/models';

export const fetchGlobalIncidentWhere = (
  event_id: number,
  archived?: boolean,
  pinned?: boolean,
  keyword?: string,
) => {
  const _where = {};

  _where['event_id'] = event_id;

  if (keyword) {
    _where[Op.or] = [
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      Sequelize.literal(
        `"incident_type"."name" ILIKE'%${keyword.toLowerCase()}%'`,
      ),
    ];
  }

  if (archived) {
    _where['$user_message_config.archived$'] = archived;
  }

  if (pinned) {
    _where['$user_message_config.pinned$'] = pinned;
  }

  return _where;
};

export const countGlobalIncidents = async (
  event_id: number,
  archived?: boolean,
  pinned?: boolean,
) => {
  return GlobalIncident.count({
    where: fetchGlobalIncidentWhere(event_id, archived, pinned),
    include: [{ model: IncidentType }, { model: UserMessageConfig }],
  });
};
