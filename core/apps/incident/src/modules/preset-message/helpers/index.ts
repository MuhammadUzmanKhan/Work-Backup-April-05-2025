import { Op } from 'sequelize';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { GetPresetMessageDto } from '../dto';

export const getAllPriorityGuideWhere = (
  getPresetMessageDto: GetPresetMessageDto,
) => {
  const { event_id, keyword } = getPresetMessageDto;
  const _where = {};

  _where['event_id'] = event_id;

  if (keyword) {
    _where[Op.or] = [
      { title: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { hot_key: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }
  return _where;
};

export function sendUpdatedPresetMessaging(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_PRESET_MESSAGE],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
