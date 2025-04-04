import { Injectable, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import moment from 'moment';
import {
  Conversation,
  Message,
  User,
  UserConversationConfig,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getIncidentMessageCenterByNumber,
  getPageAndPageSize,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { RESPONSES, SortBy } from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { SocketTypes, _MESSAGES } from '@Common/constants';
import {
  GetIncidentConversationDto,
  UpdateIncidentConversationDto,
} from './dto';
import {
  countConversations,
  fetchIncidentConversationWhere,
  getConversationById,
  sendUpdatedConversation,
} from './helper';

@Injectable()
export class ConversationService {
  constructor(private readonly pusherService: PusherService) {}

  async getIncidentConversation(
    getIncidentConversationDto: GetIncidentConversationDto,
    user: User,
  ) {
    const {
      event_id,
      page_size,
      page,
      order,
      phone_number,
      archived,
      unread,
      pinned,
      concluded,
      keyword,
    } = getIncidentConversationDto;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    await withCompanyScope(user, event_id);

    const conversations = await Conversation.findAndCountAll({
      where: fetchIncidentConversationWhere(
        event_id,
        phone_number,
        archived,
        unread,
        pinned,
        concluded,
        keyword,
      ),
      attributes: {
        include: [
          [Sequelize.literal(`"userConversationConfig"."pinned"`), 'is_pinned'],
          [
            Sequelize.literal(`"userConversationConfig"."archived"`),
            'is_archived',
          ],
          [
            Sequelize.literal(`"userConversationConfig"."concluded"`),
            'is_concluded',
          ],
          [
            Sequelize.literal(
              `"userConversationConfig"."concluded_message_id"`,
            ),
            'concluded_id',
          ],
          [
            Sequelize.literal(`"userConversationConfig"."concluded_time"`),
            'concluded_time',
          ],
          [Sequelize.literal(`"message"."guest_country_code"`), 'country_code'],
          [
            Sequelize.literal(`"message"."guest_country_iso_code"`),
            'iso_country_code',
          ],
        ],
      },
      include: [
        {
          model: Message,
          attributes: [
            'id',
            'sender_name',
            'receiver_name',
            'text',
            'unread',
            'created_at',
            'sender_id',
          ],
        },
        {
          model: UserConversationConfig,
          attributes: [],
        },
      ],
      distinct: true,
      order: [[Sequelize.literal('is_pinned'), order || SortBy.DESC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = conversations;

    const archivedCount = await countConversations(
      event_id,
      phone_number,
      true,
    );

    const unreadCount = await countConversations(
      event_id,
      phone_number,
      null,
      true,
    );

    const pinnedCount = await countConversations(
      event_id,
      phone_number,
      null,
      null,
      true,
    );

    const concludedCount = await countConversations(
      event_id,
      phone_number,
      null,
      null,
      null,
      true,
    );

    return {
      counts: {
        count,
        pinnedCount,
        archivedCount,
        unreadCount,
        concludedCount,
      },
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async updateIncidentConversation(
    id: number,
    updateIncidentConversationDto: UpdateIncidentConversationDto,
  ) {
    const { color, pinned, archived, concluded, unread, event_id } =
      updateIncidentConversationDto;
    let concludeData;

    const conversation = await Conversation.findOne({
      where: { id },
      attributes: ['id', 'message_id', 'to_number'],
      include: [
        {
          model: UserConversationConfig,
          attributes: ['id'],
        },
        {
          model: Message,
          attributes: ['id'],
        },
      ],
    });

    if (!conversation)
      throw new NotFoundException(RESPONSES.notFound('Conversation'));

    if (color)
      await conversation.update({
        color,
      });

    const userConversationConfig = conversation?.userConversationConfig;

    const message = conversation?.message;

    if (concluded) {
      concludeData = {
        concluded_message_id: conversation.message_id,
        concluded,
        concluded_time: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
      };
    }

    if (userConversationConfig) {
      await userConversationConfig.update({
        archived,
        pinned,
        ...concludeData,
      });
    }

    if (message) {
      await message.update({
        unread,
      });
    }

    const updatedConversation = await getConversationById(id, {
      useMaster: true,
    });

    const messageCenterData = await getIncidentMessageCenterByNumber(
      conversation.to_number,
      event_id,
      {
        useMaster: true,
      },
    );

    sendUpdatedConversation(
      { conversation: updatedConversation },
      event_id,
      'update',
      SocketTypes.CONVERSATION,
      false,
      this.pusherService,
    );

    sendUpdatedConversation(
      { inboxData: messageCenterData },
      event_id,
      'update',
      SocketTypes.INCIDENT_MESSAGE_CENTER,
      false,
      this.pusherService,
    );

    return { message: _MESSAGES.CONVERSATION_UPDATED_SUCCESSFULLY };
  }
}
