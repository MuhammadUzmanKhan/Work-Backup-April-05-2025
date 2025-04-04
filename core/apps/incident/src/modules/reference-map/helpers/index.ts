import { Op, Sequelize } from 'sequelize';
import { Image, ReferenceMap } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  PusherChannels,
  PusherEvents,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { ReferenceMapDto } from '../dto';
import { NotFoundException } from '@nestjs/common';

export const getReferenceMapById = async (id: number) => {
  const referenceMap = await ReferenceMap.findByPk(id, {
    attributes: {
      include: [[Sequelize.literal('"reference_map_image"."url"'), 'url']],
    },
    include: [
      {
        model: Image,
        attributes: [],
      },
    ],
  });

  if (!referenceMap)
    throw new NotFoundException(RESPONSES.notFound('Reference Map'));

  return referenceMap;
};

export const referenceMapWhere = (refMapDto: ReferenceMapDto) => {
  const _where = {};
  const { event_id, keyword } = refMapDto;

  _where['event_id'] = event_id;

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  return _where;
};

export function sendUpdatedRefrenceMap(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export const referenceMapAttributes = (event_id: number): Array<any> => {
  return [
    'id',
    'name',
    [Sequelize.literal('"reference_map_image"."url"'), 'url'],
    'event_id',
    'version',
    'current_version',
    'created_at',
    'creator_id',
    [
      Sequelize.literal(
        `(SELECT "version" FROM "reference_maps" WHERE "event_id" = ${event_id} ORDER BY "created_at" DESC LIMIT 1)`,
      ),
      'latest_version',
    ],
    [
      Sequelize.literal(
        `(SELECT "name" FROM "users" WHERE "id" = "ReferenceMap"."creator_id")`,
      ),
      'creator_name',
    ],
  ];
};
