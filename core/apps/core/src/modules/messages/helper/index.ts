import { Op, Sequelize } from 'sequelize';
import { Image, Message, User } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  MessageReceiverTypes,
  Options,
} from '@ontrack-tech-group/common/constants';

export const broadcastSentMessages = async (
  message: Message,
  pusherService: PusherService,
  options?: Options,
) => {
  if (
    MessageReceiverTypes.CAMPER === message.messageable_type ||
    MessageReceiverTypes.RESERVATION === message.message_type
  )
    return;

  const data = await Message.findOne({
    where: {
      event_id: message.event_id,
      messageable_id: message.messageable_id,
    },
    attributes: [...messageAttributes],
    include: [...messageUserInclude],
    subQuery: false,
    raw: true,
    ...options,
  });

  pusherService.broadCastConversationMessages(
    message.event_id,
    message.messageable_id,
    data,
  );
};

export const broadcastConversationsMessages = async (
  message: Message,
  pusherService: PusherService,
  options?: Options,
) => {
  if (
    MessageReceiverTypes.CAMPER === message.messageable_type ||
    MessageReceiverTypes.RESERVATION === message.message_type
  )
    return;
  const userId =
    message.messageable_type === MessageReceiverTypes.EVENT
      ? message.sender_id
      : message.messageable_id;

  const data = await Message.findOne({
    where: {
      event_id: message.event_id,
      [Op.or]: [{ messageable_id: userId }, { sender_id: userId }],
      messageable_type: { [Op.in]: ['Event', 'User'] },
    },
    attributes: [...messageAttributes],
    include: [...messageUserInclude],
    subQuery: false,
    raw: true,
    ...options,
  });

  pusherService.broadcastSentMessages(message.event_id, userId, data);
};

export const broadcastStaffMembersMessages = async (
  message: Message,
  pusherService: PusherService,
  options?: Options,
) => {
  const data = await Message.findOne({
    where: {
      event_id: message.event_id,
      [Op.or]: [
        { messageable_id: message.messageable_id },
        { sender_id: message.messageable_id },
      ],
      messageable_type: { [Op.in]: ['Event', 'User'] },
    },
    attributes: [...messageAttributes],
    include: [...messageUserInclude],
    subQuery: false,
    raw: true,
    ...options,
  });

  pusherService.broadcastStaffMembersMessages(
    message.event_id,
    message.messageable_id,
    data,
  );
};

export const messageAttributes: any = [
  'id',
  'messageable_id',
  'messageable_type',
  'message_type',
  'phone_number',
  'sender_id',
  [Sequelize.literal(`"user->images"."url"`), 'sender_image'],
  [Sequelize.literal(`"message_type"`), 'receiver_type'],
  [Sequelize.literal(`"messageable_id"`), 'receiver_id'],
  'sender_name',
  'receiver_name',
  'text',
  'created_at',
];

export const messageUserInclude: any = [
  { model: User, attributes: [], include: [{ model: Image, attributes: [] }] },
];
