import { Op, Sequelize } from 'sequelize';
import {
  Conversation,
  Message,
  UserConversationConfig,
} from '@ontrack-tech-group/common/models';
import { NotFoundException } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';

import {
  Options,
  PusherChannels,
  PusherEvents,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';

export const fetchIncidentConversationWhere = (
  event_id: number,
  phone_number: string,
  archived?: boolean,
  unread?: boolean,
  pinned?: boolean,
  concluded?: boolean,
  keyword?: string,
) => {
  const _where = {};

  _where['event_id'] = event_id;

  _where['to_number'] = phone_number;

  if (keyword) {
    _where[Op.or] = [
      Sequelize.literal(`"message"."text" ILIKE'%${keyword.toLowerCase()}%'`),
      Sequelize.literal(
        `"message"."sender_name" ILIKE'%${keyword.toLowerCase()}%'`,
      ),
      Sequelize.literal(
        `"message"."from_number" ILIKE'%${keyword.toLowerCase()}%'`,
      ),
    ];
  }

  if (unread) {
    _where['$message.unread$'] = unread;
  }

  if (archived) {
    _where['$userConversationConfig.archived$'] = archived;
  }

  if (pinned) {
    _where['$userConversationConfig.pinned$'] = pinned;
  }

  if (concluded) {
    _where['$userConversationConfig.concluded$'] = concluded;
  }

  return _where;
};

export const countConversations = async (
  event_id: number,
  phone_number: string,
  archived?: boolean,
  unread?: boolean,
  pinned?: boolean,
  concluded?: boolean,
) => {
  return Conversation.count({
    where: fetchIncidentConversationWhere(
      event_id,
      phone_number,
      archived,
      unread,
      pinned,
      concluded,
    ),
    include: [
      {
        model: Message,
        attributes: [],
      },
      { model: UserConversationConfig, attributes: [] },
    ],
  });
};

export function sendUpdatedConversation(
  data,
  event_id,
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

export const getConversationById = async (id: number, options?: Options) => {
  const conversation = await Conversation.findOne({
    where: { id },
    attributes: {
      include: [
        [Sequelize.literal(`"userConversationConfig"."pinned"`), 'is_pinned'],
        [
          Sequelize.literal(`"userConversationConfig"."archived"`),
          'is_archived',
        ],
      ],
    },
    include: [
      {
        model: Message,
        attributes: ['id', 'sender_name', 'receiver_name', 'text', 'unread'],
      },
      {
        model: UserConversationConfig,
        attributes: [],
      },
    ],
    ...options,
  });

  if (!conversation)
    throw new NotFoundException(RESPONSES.notFound('Conversation'));

  return conversation;
};
