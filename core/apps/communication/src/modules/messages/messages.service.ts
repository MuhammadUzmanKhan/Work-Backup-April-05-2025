import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, NotFoundException, RawBodyRequest } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  Camper,
  Image,
  Message,
  MessageGroup,
  OptoutNumbers,
  User,
  UserMessageConfig,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MessageTypes,
  MessageTypesIndexes,
  OptInOptions,
  OptOutOptions,
  Options,
  PolymorphicType,
  PusherEvents,
  SortBy,
  isOntrackRole,
  rails_webhook_url,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  PusherService,
  postRequest,
  postRequestWithoutToken,
} from '@ontrack-tech-group/common/services';
import { MessageGroupService } from '@Modules/message-group/message-group.service';
import { fetchMessageGroupUsers } from '@Common/helpers';
import { _MESSAGES } from '@Common/constants';
import { RailsWebhookChannel, SocketTypes } from '@Common/constants/enums';
import { TwilioWebhookDataInterface } from '@Common/interfaces';
import {
  CreateMessageDto,
  CreateMessageSQSDto,
  GetGroupMessagesDto,
  GetIncidentMessagesDto,
  MessagesQueryParamsDto,
} from './dto';
import {
  IncidetnMessagesWhere,
  broadcastConversationsMessages,
  broadcastSentMessages,
  broadcastStaffMembersMessages,
  commonMessageAttributes,
  formatAndSendMessageToSQS,
  getConversationById,
  getGroupMessagesWhere,
  getMessageByIdHelper,
  messageAttributes,
  messageUserInclude,
  sendMessage,
  sendUpdatedMessage,
  socketForMessageCenter,
} from './helper';

@Injectable()
export class MessagesService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly messageGroupService: MessageGroupService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
  ) {}
  async createMessage(body: CreateMessageDto, user: User, req: Request) {
    const {
      event_id,
      receiver_id,
      receiver_type,
      text,
      from_number,
      to_number,
      country_code,
      country_iso_code,
    } = body;

    let message: Message;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    const _company_id = isOntrackRole(user['role'])
      ? company_id
      : user['company_id'];

    const transaction = await this.sequelize.transaction();

    try {
      message = await Message.create(
        {
          messageable_id: receiver_id,
          messageable_type: receiver_type,
          text,
          event_id,
          sender_id: user.id,
          sender_name: user.name,
          message_type: MessageTypes.SENT,
          company_id: _company_id,
          from_number,
          to_number,
          guest_country_code: country_code,
          guest_country_iso_code: country_iso_code,
        },
        { raw: true, transaction },
      );

      const [userMessageConfig] = await UserMessageConfig.findOrCreate({
        where: {
          event_id,
          user_id: user.id,
          config_id: receiver_id,
          config_type: receiver_type,
          message_type: MessageTypesIndexes.SENT,
        },
        defaults: {
          message_id: message.id,
        },
        transaction,
      });

      userMessageConfig.message_id = message.id;
      await userMessageConfig.save({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    const messageData = await getMessageByIdHelper(message.id);

    broadcastConversationsMessages(message, this.pusherService, {
      useMaster: true,
    });
    broadcastSentMessages(message, this.pusherService, { useMaster: true });
    broadcastStaffMembersMessages(message, this.pusherService, {
      useMaster: true,
    });

    // Pusher for new message
    this.pusherService.sendNewMessage(messageData);

    await sendMessage(message);

    const webhookData = {
      body: {
        company_id,
        event_id,
        message_id: message.id,
      },
      event_id,
      channel_name: RailsWebhookChannel.SEND_USER_MESSAGE,
    };

    const messageSocketData = await this.getMessageById(message.id, {
      useMaster: true,
    });

    sendUpdatedMessage(
      { message: messageSocketData },
      event_id,
      'send',
      SocketTypes.MESSAGE,
      true,
      this.pusherService,
      PusherEvents.INCIDENT_MESSAGE,
    );

    try {
      postRequest(
        req.headers.authorization,
        this.httpService,
        webhookData,
        rails_webhook_url,
      );
    } catch (err) {
      console.log('🚀 ~ MessagesService ~ createMessage ~ err:', err);
    }

    return { message: _MESSAGES.MESSAGE_SENT_SUCCESSFULLY };
  }

  async getMessages(query: MessagesQueryParamsDto) {
    let user: User;
    let camper: Camper;
    let messageGroupIds: number[] = [];

    const { page, page_size, event_id, user_id, camper_id, keyword } = query;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const { company_id } = await isEventExist(event_id);

    if (user_id) {
      user = await User.findByPk(user_id, {
        include: [
          {
            model: MessageGroup,
            where: { event_id },
            attributes: ['id'],
            required: false,
          },
        ],
      });

      if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      messageGroupIds = user?.message_groups.map((group) => group.id) || [];
    }

    if (camper_id) {
      camper = await Camper.findByPk(camper_id);
      if (!camper) throw new NotFoundException(ERRORS.CAMPER_NOT_FOUND);
    }

    const messagesWithCount = await Message.findAndCountAll({
      where: {
        ...(keyword ? { text: { [Op.iLike]: `%${keyword}%` } } : {}),
        event_id,
        [Op.or]: [
          { messageable_id: user_id ? user.id : camper.id },
          { sender_id: user_id ? user.id : camper.id },
          user_id ? { messageable_id: { [Op.in]: messageGroupIds } } : {},
        ],
        messageable_type: { [Op.in]: ['Event', 'User', 'MessageGroup'] },
      },
      attributes: ['id'],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
      order: [['created_at', SortBy.DESC]],
    });

    const messageIds = messagesWithCount.rows.map((message) => message.id);

    const messages = await Message.findAll({
      where: { id: { [Op.in]: messageIds } },
      attributes: [
        ...messageAttributes,
        [
          Sequelize.literal(`(
            SELECT
            CASE
              WHEN "ucr"."role_id" = 0 THEN 'super_admin'
              WHEN "ucr"."role_id" = 28 THEN 'ontrack_manager'
              ELSE "roles"."name"
            END AS "name"
            FROM "roles"
            INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
            WHERE "ucr"."user_id" = "Message"."sender_id"
            AND (
              "ucr"."role_id" IN (0, 28)
              OR "ucr"."company_id" = ${company_id}
            )
            LIMIT 1
          )`),
          'sender_role',
        ],
      ],
      include: [...messageUserInclude],
      order: [['created_at', SortBy.DESC]],
      subQuery: false,
    });

    const { count } = messagesWithCount;

    return {
      data: messages,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getGroupMessages(getGroupMessagesDto: GetGroupMessagesDto) {
    const { event_id, message_group_id, keyword } = getGroupMessagesDto;

    const [page, page_size] = getPageAndPageSize(
      getGroupMessagesDto.page,
      getGroupMessagesDto.page_size,
    );

    const event = await isEventExist(event_id);

    const messageGroup =
      await this.messageGroupService.getMessageGroupById(message_group_id);

    const groupMessagesWithCount = await Message.findAndCountAll({
      where: {
        event_id,
        messageable_id: message_group_id,
        messageable_type: PolymorphicType.MESSAGE_GROUP,
        ...getGroupMessagesWhere(keyword),
      },
      attributes: ['id', 'createdAt', 'sender_name'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: [],
          include: [
            {
              model: Image,
              attributes: [],
            },
          ],
        },
      ],
      limit: page_size || undefined,
      offset: page_size * page || undefined,
      order: [['createdAt', SortBy.DESC]],
      distinct: true,
    });

    const { rows, count } = groupMessagesWithCount;

    const groupMessagesIds = rows.map((message) => message.id);

    const groupMessages = await Message.findAll({
      where: { id: { [Op.in]: groupMessagesIds } },
      attributes: [
        'id',
        'sender_id',
        'text',
        'message_type',
        'createdAt',
        'messageable_type',
        'messageable_id',
        'sender_name',
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
      order: [['createdAt', SortBy.DESC]],
      subQuery: false,
    });

    const groupMessageUsers = await fetchMessageGroupUsers(
      event.company_id,
      messageGroup,
    );

    return {
      data: groupMessages,
      pagination: calculatePagination(count, page_size, page),
      messageGroupUsersCount: groupMessageUsers.length,
    };
  }

  async createMessagesForSQS(userNumbersWithMessage: CreateMessageSQSDto) {
    formatAndSendMessageToSQS(userNumbersWithMessage);

    return { success: true };
  }

  async telnyxWebhook(req: RawBodyRequest<Request>, webhookData: any) {
    try {
      const { data } = webhookData;
      const cell = data?.payload?.to[0].phone_number;
      const from = webhookData.data?.payload?.from?.phone_number;

      //Checking if autoresponse_type value is available in webhook or not and storing it in variable so no need to chain again.
      const autoresponse_type: string = data?.payload?.autoresponse_type;

      if (data?.event_type === 'message.received') {
        if (OptInOptions[autoresponse_type?.toUpperCase()]) {
          //Start and unstop are the cases for opt-in, so we will delete record from optout tables.
          await OptoutNumbers.destroy({ where: { cell } });
        } else if (
          OptOutOptions[autoresponse_type?.toUpperCase()] ||
          autoresponse_type === OptOutOptions.STOP_ALL
        ) {
          await OptoutNumbers.findOrCreate({ where: { cell } });
        }
      }

      const url = `${this.configService.get('RAILS_BASE_URL')}/messages/by_twilio`;

      const body = {
        Body: data?.payload.text,
        From: from,
        To: cell,
      };

      const webhookResponse = await postRequestWithoutToken(
        this.httpService,
        body,
        url,
      );

      const {
        conversation: { id },
      } = webhookResponse.data;

      const conversationData = await getConversationById(id);

      const messageSocketData = await this.getMessageById(
        conversationData?.message.id,
      );

      socketForMessageCenter(
        webhookResponse,
        this.pusherService,
        this.sequelize,
        messageSocketData,
      );
    } catch (err) {
      console.log('Error in webhook: ', err);
    }

    return 'success';
  }

  async twilioWebhook(
    req: RawBodyRequest<Request>,
    webhookData: TwilioWebhookDataInterface,
  ) {
    try {
      const { To, From, Body } = webhookData;

      const url = `${this.configService.get('RAILS_BASE_URL')}/messages/by_twilio`;

      const body = {
        Body,
        From,
        To,
      };

      const webhookResponse = await postRequestWithoutToken(
        this.httpService,
        body,
        url,
      );

      const {
        conversation: { id },
      } = webhookResponse.data;

      const conversationData = await getConversationById(id);

      const messageSocketData = await this.getMessageById(
        conversationData?.message.id,
      );

      socketForMessageCenter(
        webhookResponse,
        this.pusherService,
        this.sequelize,
        messageSocketData,
      );
    } catch (err) {
      console.log('Error in webhook: ', err);
    }

    return 'success';
  }

  async assignNumberToUser() {
    const users = await User.findAll({
      where: { sender_cell: null, blocked_at: { [Op.eq]: null } },
      attributes: ['id', 'sender_cell'],
      limit: 2000,
    });

    const numbers = process.env.TELNYX_PHONE_NUMBERS.split(',');

    for (let i = 0; i < users.length; i++) {
      const index = i % numbers.length; // Calculate the index within the num array.
      await User.update(
        { sender_cell: numbers[index] },
        { where: { id: users[i].id } },
      );
    }

    return { message: 'Success' };
  }

  async assignNumberToCampers() {
    const numbers = process.env.TELNYX_PHONE_NUMBERS.split(',');

    const campers = await Camper.findAll({
      where: { sender_cell: null },
      attributes: ['id', 'cell', 'country_code'],
      limit: 10000,
    });

    for (let i = 0; i < campers.length; i++) {
      const index = i % numbers.length; // Calculate the index within the num array.

      const user = await User.findOne({
        where: { cell: campers[i].cell, country_code: campers[i].country_code },
        attributes: ['cell', 'sender_cell'],
      });

      await Camper.update(
        { sender_cell: user ? user.sender_cell : numbers[index] },
        { where: { id: campers[i].id } },
      );
    }

    return { message: 'Success' };
  }

  async getIncidentMessages(
    user: User,
    getIncidentMessagesDto: GetIncidentMessagesDto,
  ) {
    const { event_id } = getIncidentMessagesDto;

    await withCompanyScope(user, event_id);

    return await Message.findAll({
      where: IncidetnMessagesWhere(getIncidentMessagesDto),
      attributes: commonMessageAttributes,
      order: [['created_at', SortBy.ASC]],
    });
  }

  async getMessageById(id: number, options?: Options) {
    return await Message.findOne({
      where: { id },
      attributes: commonMessageAttributes,
      ...options,
    });
  }
}
