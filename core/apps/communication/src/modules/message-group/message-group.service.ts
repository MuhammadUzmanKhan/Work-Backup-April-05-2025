import { Op, Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Department,
  Event,
  MessageGroup,
  MessageGroupUsers,
  User,
  UserCompanyRole,
  UserPins,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MESSAGES,
  MessageGroupableType,
  MessageType,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  createUserPin,
  deleteUserPin,
  findUserPin,
} from '@ontrack-tech-group/common/services';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { fetchMessageGroupUsers } from '@Common/helpers';
import {
  AddUserToMessageGroupDto,
  GetMessageGroupsByEventDto,
  CreateCustomMessageGroupDto,
  CreateMessageGroupDto,
  UpdateMessageGroupDto,
  GetMessageGroupUser,
} from './dto';
import {
  fetchMessageGroupUsersQuery,
  getDivisionCount,
  getIncludeModels,
  getMessageGroupsByEventWhere,
} from './helper';

@Injectable()
export class MessageGroupService {
  async createMessageGroup(
    createMessageGroupDto: CreateMessageGroupDto,
    user: User,
  ) {
    const { event_id, name, department_id } = createMessageGroupDto;
    const [company_id] = await withCompanyScope(user, event_id);

    const department = await Department.findOne({
      where: { id: department_id, company_id },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
    if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

    const [messageGroup] = await MessageGroup.findOrCreate({
      where: {
        company_id,
        message_type: MessageType.DEPARTMENT,
        message_groupable_type: MessageGroupableType.DEPARTMENT,
        message_groupable_id: department_id,
        event_id,
      },
    });

    messageGroup.name = name;
    await messageGroup.save();

    const _messageGroup = messageGroup.get({ plain: true });

    _messageGroup.message_type = Object.keys(MessageType)
      .filter((type) => isNaN(Number(type)))
      [_messageGroup.message_type].toLowerCase() as any;

    _messageGroup.department = department;

    return _messageGroup;
  }

  async createCustomMessageGroup(
    createCustomMessageGroupDto: CreateCustomMessageGroupDto,
    user: User,
  ) {
    const { event_id, name, color_code } = createCustomMessageGroupDto;
    const [company_id] = await withCompanyScope(user, event_id);

    const createdMessageGroup = await MessageGroup.create({
      name,
      company_id,
      message_type: MessageType.CUSTOM,
      message_groupable_type: MessageGroupableType.EVENT,
      message_groupable_id: event_id,
      event_id,
      color_code,
    });

    createdMessageGroup.message_type = Object.keys(MessageType)
      .filter((type) => isNaN(Number(type)))
      [createdMessageGroup.message_type].toLowerCase() as any;

    return createdMessageGroup;
  }

  async getMessageGroupsByEvent(
    getMessageGroupsByEventDto: GetMessageGroupsByEventDto | any,
    user: User,
  ) {
    const { event_id, group_type } = getMessageGroupsByEventDto;

    const event = await Event.findByPk(event_id);
    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const messageGroup = await MessageGroup.findAll({
      where: getMessageGroupsByEventWhere(getMessageGroupsByEventDto),
      attributes: {
        exclude: ['updatedAt'],
        include: [
          [
            Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM "user_pins"
                WHERE "user_pins"."pinable_id" = "MessageGroup"."id" AND "user_pins"."pinable_type" = 'MessageGroup' AND "user_pins"."user_id" = ${user.id}
              )
            `),
            'isPinned',
          ],
          [MessageGroup.getMessageTypeByKey, 'message_type'],
          [
            Sequelize.literal(fetchMessageGroupUsersQuery(group_type, event)),
            'staff',
          ],
          ...getDivisionCount(group_type, event_id),
        ],
      },
      include: [
        ...getIncludeModels(group_type),
        {
          model: UserPins,
          as: 'user_pin_message_groups',
          where: { user_id: user.id },
          attributes: [],
          required: false,
        },
      ],
      order: [
        [
          { model: UserPins, as: 'user_pin_message_groups' },
          'pinable_id',
          SortBy.ASC,
        ],
        ['id', 'ASC'],
      ],
    });

    return messageGroup;
  }

  async addUserToGroup(addUserToMessageGroupDto: AddUserToMessageGroupDto) {
    const { user_ids, message_group_id } = addUserToMessageGroupDto;

    // Check if message group exist using message_group_id
    const messageGroup = await MessageGroup.findByPk(message_group_id, {
      attributes: [
        'id',
        'company_id',
        'event_id',
        'message_groupable_type',
        'message_groupable_id',
      ],
    });
    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    // Find all users if user exists in db by provided user_ids and company id
    const users = await User.findAll({
      where: {
        id: { [Op.in]: user_ids },
        blocked_at: { [Op.eq]: null },
      },
      include: [
        {
          model: UserCompanyRole,
          where: { company_id: messageGroup.company_id },
          attributes: [],
        },
      ],
      attributes: ['id'],
    });
    if (!users.length) throw new NotFoundException(ERRORS.NO_USER_FOUND);

    // Check if user already exists so we can filter out them in bulk create
    const messageGroupUsers = await MessageGroupUsers.findAll({
      where: { message_group_id },
      attributes: ['user_id'],
    });

    const userIdsAlreadyAdded = messageGroupUsers.map(
      (messageGroupUsers: MessageGroupUsers) => messageGroupUsers.user_id,
    );

    // Adding users in message group after filter out already created
    await MessageGroupUsers.bulkCreate(
      users
        .filter((user) => !userIdsAlreadyAdded.includes(user.id))
        .map((user) => ({ user_id: user.id, message_group_id })),
    );

    const newUsers = await fetchMessageGroupUsers(
      messageGroup.company_id,
      messageGroup,
    );

    return {
      message: MESSAGES.USERS_SUCCESSFULLY_ADDED_IN_MESSAGE_GROUP,
      userCount: newUsers.length,
    };
  }

  async pinMessageGroup(id: number, user: User) {
    const messageGroup = await MessageGroup.findByPk(id);
    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    // fetching message group is pinned or not
    const pinnedMessageGroup = await findUserPin(
      id,
      user.id,
      PolymorphicType.MESSAGE_GROUP,
    );

    if (!pinnedMessageGroup) {
      // if not pin message group exist creating new entery for pinning a message group
      await createUserPin(id, user.id, PolymorphicType.MESSAGE_GROUP);

      // TODO:Add Proper Message
      return { message: 'Message Group Successfully Pinned' };
    } else {
      // if pin message group exist destroying old record from db
      await deleteUserPin(id, user.id, PolymorphicType.MESSAGE_GROUP);

      return { message: 'Message Group Successfully Unpinned' };
    }
  }

  async getMessageGroupById(id: number, eventId?: number) {
    const _where = { id };
    if (eventId) _where['event_id'] = eventId;

    const messageGroup = await MessageGroup.findOne({
      where: _where,
      attributes: { exclude: ['updatedAt', 'createdAt'] },
    });

    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    return messageGroup;
  }

  async updateMessageGroup(
    messageGroupId: number,
    updateMessageGroupDto: UpdateMessageGroupDto,
  ) {
    const messageGroup = await MessageGroup.findByPk(messageGroupId);

    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    await messageGroup.update({ ...updateMessageGroupDto });

    return messageGroup;
  }

  async deleteMessageGroup(id: number) {
    const messageGroup = await MessageGroup.findByPk(id, {
      attributes: ['id'],
    });

    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    await messageGroup.destroy();

    return { message: RESPONSES.destroyedSuccessfully('Message Group') };
  }

  async getMessageGroupUser(
    id: number,
    getMessageGroupUser: GetMessageGroupUser,
  ) {
    const event = await Event.findByPk(getMessageGroupUser.event_id, {
      attributes: ['company_id', 'id'],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const messageGroup = await this.getMessageGroupById(id, event.id);

    if (!messageGroup)
      throw new NotFoundException(ERRORS.MESSAGE_GROUP_NOT_FOUND);

    const users = await fetchMessageGroupUsers(
      event.company_id,
      messageGroup,
      getMessageGroupUser,
    );

    return users;
  }
}
