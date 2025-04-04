import { NotAcceptableException } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  PusherChannels,
  PusherEvents,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { IncidentMessageCenter } from '@ontrack-tech-group/common/models';
import { Op } from 'sequelize';
import { GetIncidentMessageCenterDto } from '../dto';

export const getAllIncidentMessageWhere = (
  getIncidentMessageCenterDto: GetIncidentMessageCenterDto,
) => {
  const { event_id, keyword } = getIncidentMessageCenterDto;

  const _where = {};

  _where['event_id'] = event_id;

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { phone_number: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export function sendUpdatedIncidentMessageCenter(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_MESSAGE_CENTER],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export const incidentMessageCenterValidation = async (
  event_id: number,
  country_code: string,
  phone_number: string,
  id?: number,
) => {
  const whereClause = {
    event_id,
    country_code,
    phone_number,
  };

  // Conditionally add the id exclusion filter if `id` is provided
  if (id) {
    whereClause['id'] = { [Op.notIn]: [id] };
  }

  const existingMessageCenter = await IncidentMessageCenter.findAll({
    where: whereClause,
    attributes: ['id'],
  });

  if (existingMessageCenter.length) {
    throw new NotAcceptableException(
      RESPONSES.alreadyExist('Incident Message With Same Number'),
    );
  }
};
