import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import {
  Conversation,
  Event,
  Image,
  Incident,
  Message,
  MessageGroup,
  User,
  UserConversationConfig,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  MessageReceiverTypes,
  MessageTypes,
  MessageableType,
  Options,
  PusherChannels,
  PusherEvents,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { getIncidentMessageCenterByNumber } from '@ontrack-tech-group/common/helpers';
import { fetchMessageGroupUsers } from '@Common/helpers';
import { SocketTypes } from '@Common/constants/enums';
import {
  CreateMessageSQSDto,
  GetIncidentMessagesDto,
  UserNumbersDto,
} from '../dto';

export const broadcastSentMessages = async (
  message: Message,
  pusherService: PusherService,
  options?: Options,
) => {
  const { messageable_type, message_type, event_id, messageable_id, id } =
    message;

  if (
    MessageReceiverTypes.CAMPER === messageable_type ||
    MessageReceiverTypes.RESERVATION === message_type
  )
    return;

  const data = await Message.findOne({
    where: {
      id,
      event_id,
      messageable_id,
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
  const {
    messageable_type,
    message_type,
    event_id,
    messageable_id,
    id,
    sender_id,
  } = message;

  if (
    MessageReceiverTypes.CAMPER === messageable_type ||
    MessageReceiverTypes.RESERVATION === message_type
  )
    return;

  const userId =
    messageable_type === MessageReceiverTypes.EVENT
      ? sender_id
      : messageable_id;

  const data = await Message.findOne({
    where: {
      id,
      event_id,
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
  const { event_id, messageable_id, id, sender_id } = message;

  const data = await Message.findOne({
    where: {
      id,
      event_id,
      [Op.or]: [{ messageable_id }, { sender_id }],
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
  {
    model: User,
    as: 'user',
    attributes: [],
    include: [
      {
        model: Image,
        attributes: [],
        where: { primary: true },
        required: false,
      },
    ],
  },
];

export const getGroupMessagesWhere = (keyword: string) => {
  const where = {};

  if (keyword) {
    where[Op.or] = [
      { text: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { sender_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return where;
};

export const sendMessage = async (message: Message) => {
  const {
    message_type,
    messageable_type,
    messageable_id,
    to_number,
    from_number,
  } = message;

  if (message_type === MessageTypes.RECEIVED) return;

  if (!getMessageableObject(message)) return;

  if (messageable_type === MessageableType.MESSAGE_GROUP) {
    const messageGroup = await MessageGroup.findByPk(messageable_id);

    const { message_service } = messageGroup;
    if (!message_service) return;

    const users = await fetchMessageGroupUsers(
      messageGroup.company_id,
      messageGroup,
    );

    const userNumbers = users
      .filter((user) => user.message_service && !user.blocked_at)
      .map((user) => ({
        cell: user.country_code + user.cell,
        sender_cell: user.sender_cell,
      }));

    if (userNumbers?.length) {
      formatAndSendMessageToSQS({ userNumbers, messageBody: message.text });
    }
  } else if (messageable_type === MessageableType.USER) {
    const user = await User.findOne({
      where: { id: messageable_id },
      attributes: [
        'message_service',
        'blocked_at',
        'country_code',
        'cell',
        'sender_cell',
      ],
    });

    if (!user) throw new NotFoundException(RESPONSES.notFound('User'));

    const to = user.country_code + user.cell;
    const from = user.sender_cell;

    message.to_number = to;
    message.from_number = from;
    await message.save();

    formatAndSendMessageToSQS({
      userNumbers: [{ cell: to, sender_cell: from }],
      messageBody: message.text,
    });
  } else if (messageable_type === MessageableType.INCIDENT_MESSAGE_CENTER) {
    formatAndSendMessageToSQS({
      userNumbers: [{ cell: to_number, sender_cell: from_number }],
      messageBody: message.text,
      messageableType: MessageableType.INCIDENT_MESSAGE_CENTER,
    });
  }
};

export const getMessageableObject = async (message: Message) => {
  const { messageable_type, messageable_id } = message;

  if (messageable_type === MessageableType.EVENT) {
    return await Event.findByPk(messageable_id, { attributes: ['id'] });
  } else if (messageable_type === MessageableType.MESSAGE_GROUP) {
    return await MessageGroup.findByPk(messageable_id, { attributes: ['id'] });
  } else if (messageable_type === MessageableType.USER) {
    return await User.findByPk(messageable_id, { attributes: ['id'] });
  } else if (messageable_type === MessageableType.INCIDENT) {
    return await Incident.findByPk(messageable_id, { attributes: ['id'] });
  }
};

export const formatAndSendMessageToSQS = (
  userNumbersWithMessage: CreateMessageSQSDto,
) => {
  AWS.config.update({
    region: process.env.SQS_REGION,
    accessKeyId: process.env.SQS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY,
  });

  const messageableType = userNumbersWithMessage.messageableType;

  userNumbersWithMessage.userNumbers.map((userNumbersDto: UserNumbersDto) => {
    const { cell, sender_cell } = userNumbersDto;
    const phoneNumbers = process.env.TELNYX_PHONE_NUMBERS.split(',');
    let _phoneNumber = null;
    let twilioNumber = null;

    const regex = /^ref_user_\d+$/;

    if (regex.test(cell)) {
      return;
    }

    if (
      messageableType === MessageableType.INCIDENT ||
      messageableType === MessageableType.INCIDENT_MESSAGE_CENTER
    ) {
      twilioNumber = process.env.TWILIO_FROM_PHONE_NUMBER;
    }

    if (!sender_cell) {
      _phoneNumber = getRandomPhoneNumbers(phoneNumbers, 1)[0];
    }

    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageAttributes: {
        phone: {
          DataType: 'String',
          StringValue: cell,
        },
        sender: {
          DataType: 'String',
          StringValue: sender_cell || _phoneNumber,
        },
        // Only include twilioNumber if it has a valid value
        ...(twilioNumber && {
          twilioNumber: {
            DataType: 'String',
            StringValue: twilioNumber,
          },
        }),
      },
      MessageBody: `${userNumbersWithMessage.messageBody}`,
      MessageGroupId: crypto.randomBytes(5).toString('hex'), // A unique alphanumeric required
      MessageDeduplicationId: crypto.randomBytes(5).toString('hex'), // A unique alphanumeric required
    };

    // Send the message to the SQS queue
    return new AWS.SQS().sendMessage(params).promise();
  });
};

export const getRandomPhoneNumbers = (
  phoneNumbers: string[],
  batchSize: number,
) => {
  const uniquePhones = [...phoneNumbers];
  const shuffledPhones = uniquePhones.sort(() => Math.random() - 0.5);
  return shuffledPhones.slice(0, batchSize);
};

export const IncidetnMessagesWhere = (
  getIncidentMessagesDto: GetIncidentMessagesDto,
) => {
  const _where: any = { [Op.and]: [] };

  const { event_id, from_number, to_number } = getIncidentMessagesDto;

  _where[Op.and].push({
    [Op.or]: [
      { from_number },
      { to_number: from_number },
      {
        [Op.and]: [{ from_number: to_number }, { to_number: from_number }],
      },
    ],
  });
  _where[Op.and].push({
    event_id: event_id,
  });

  return _where;
};

export const sendUpdatedMessage = (
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
  pusherEvent,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [pusherEvent],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

export const unreadCount = async (sequelize: Sequelize, event_id: number) => {
  return await sequelize.query(
    `SELECT 
      (
        SELECT CAST(COUNT(DISTINCT conversations.id) AS INTEGER)
        FROM conversations
        INNER JOIN messages ON conversations.message_id = messages.id
        WHERE messages.unread = true
          AND conversations.event_id = ${event_id}
      ) AS unread`,
    {
      type: QueryTypes.SELECT,
    },
  );
};

export const getConversationById = async (id: number) => {
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
  });

  if (!conversation)
    throw new NotFoundException(RESPONSES.notFound('Conversation'));

  return conversation;
};

export const messageCount = async (from: string, to: string) => {
  return await Message.count({
    where: {
      from_number: {
        [Op.like]: `%${from}%`,
      },
      to_number: {
        [Op.like]: `%${to}%`,
      },
    },
  });
};

export const socketForMessageCenter = async (
  webhookResponse,
  pusher: PusherService,
  sequelize: Sequelize,
  messageSocketData,
) => {
  const {
    conversation: { id, event_id, to_number, from_number },
  } = webhookResponse.data;

  const conversationData = await getConversationById(id);

  const unreadCountSocket = await unreadCount(sequelize, event_id);

  const messageCountData = await messageCount(from_number, to_number);

  const messageCenterData = await getIncidentMessageCenterByNumber(
    to_number,
    event_id,
  );

  sendUpdatedMessage(
    { count: unreadCountSocket },
    event_id,
    'unread_count',
    null,
    true,
    pusher,
    'event-messaging-center-unread-counts',
  );

  sendUpdatedMessage(
    { message: messageSocketData },
    event_id,
    'received',
    SocketTypes.MESSAGE,
    true,
    pusher,
    PusherEvents.INCIDENT_MESSAGE,
  );

  sendUpdatedMessage(
    { conversation: conversationData },
    event_id,
    messageCountData > 1 ? 'received_message' : 'new',
    SocketTypes.CONVERSATION,
    true,
    pusher,
    PusherEvents.INCIDENT_MESSAGE_CENTER,
  );

  sendUpdatedMessage(
    { inboxData: messageCenterData },
    event_id,
    'update',
    SocketTypes.INCIDENT_MESSAGE_CENTER,
    false,
    pusher,
    PusherEvents.INCIDENT_MESSAGE_CENTER,
  );
};

export const getMessageByIdHelper = async (id: number) => {
  return await Message.findByPk(id, {
    attributes: [
      'messageable_id',
      'messageable_type',
      'company_id',
      'text',
      'event_id',
      'sender_id',
      'message_type',
      [Sequelize.literal(`"sender->images"."url"`), 'sender_image'],
      [Sequelize.literal(User.getSenderStatusByKey), 'status'],
    ],
    include: [
      {
        model: User,
        as: 'sender',
        attributes: [],
        include: [
          {
            model: Image,
            attributes: [],
            where: { primary: true },
            required: false,
          },
        ],
      },
    ],
    subQuery: false,
    useMaster: true,
  });
};

export const commonMessageAttributes = [
  'id',
  'sender_id',
  'text',
  'message_type',
  'created_at',
  'sender_name',
  'to_number',
  'from_number',
  'guest_country_code',
  'guest_country_iso_code',
];
