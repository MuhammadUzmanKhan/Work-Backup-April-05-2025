import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import {
  Camper,
  Message,
  MessageGroup,
  User,
  UserMessageConfig,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MessageTypes,
  MessageTypesIndexes,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { CreateMessageDto, MessagesQueryParamsDto } from './dto';
import {
  broadcastConversationsMessages,
  broadcastSentMessages,
  broadcastStaffMembersMessages,
  messageAttributes,
  messageUserInclude,
} from './helper';

@Injectable()
export class MessagesService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly configService: ConfigService,
  ) {}

  public async createMessage(body: CreateMessageDto, user: User) {
    const message = await Message.create(
      {
        messageable_id: body.receiver_id,
        messageable_type: body.receiver_type,
        company_id: user['company_id'],
        text: body.text,
        event_id: body.event_id,
        sender_id: user.id,
        message_type: MessageTypes.SENT,
      },
      { raw: true },
    );

    if (!message)
      throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);

    const userMessageConfig = (
      await UserMessageConfig.findOrCreate({
        where: {
          event_id: body.event_id,
          user_id: user.id,
          config_id: body.receiver_id,
          config_type: body.receiver_type,
          message_type: MessageTypesIndexes.SENT,
        },
      })
    )[0];

    userMessageConfig.message_id = message.id;
    userMessageConfig.save();

    broadcastConversationsMessages(message, this.pusherService, {
      useMaster: true,
    });
    broadcastSentMessages(message, this.pusherService, {
      useMaster: true,
    });
    broadcastStaffMembersMessages(message, this.pusherService, {
      useMaster: true,
    });

    return { message: 'Message sent successfully' };
  }

  public async getMessages(query: MessagesQueryParamsDto) {
    let user: User;
    let camper: Camper;
    let messageGroupIds: number[] = [];

    const [page, page_size] = getPageAndPageSize(query.page, query.page_size);

    if (query.user_id) {
      user = await User.findByPk(query.user_id, {
        include: [
          {
            model: MessageGroup,
            where: { event_id: query.event_id },
            attributes: ['id'],
            required: false,
          },
        ],
      });

      if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      messageGroupIds = user?.message_groups.map((group) => group.id) || [];
    }

    if (query.camper_id) {
      camper = await Camper.findByPk(query.camper_id);
      if (!camper) throw new NotFoundException(ERRORS.CAMPER_NOT_FOUND);
    }

    const messages = await Message.findAndCountAll({
      where: {
        ...(query.keyword
          ? { text: { [Op.iLike]: `%${query.keyword}%` } }
          : {}),
        event_id: query.event_id,
        [Op.or]: [
          { messageable_id: query.user_id ? user.id : camper.id },
          { sender_id: query.user_id ? user.id : camper.id },
          query.user_id ? { messageable_id: { [Op.in]: messageGroupIds } } : {},
        ],
        messageable_type: { [Op.in]: ['Event', 'User', 'MessageGroup'] },
      },
      attributes: [...messageAttributes],
      include: [...messageUserInclude],
      order: [['created_at', 'asc']],
      limit: page_size || parseInt(this.configService.get('PAGE_LIMIT')),
      offset: page_size * page || parseInt(this.configService.get('PAGE')),
    });

    const { rows, count } = messages;

    return {
      data: rows,
      pagination: calculatePagination(
        count,
        page_size || parseInt(this.configService.get('PAGE_LIMIT')),
        page || parseInt(this.configService.get('PAGE')),
      ),
    };
  }
}
