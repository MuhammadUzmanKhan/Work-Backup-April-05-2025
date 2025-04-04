import { QueryTypes } from 'sequelize';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { IncidentMessageCenter, User } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MESSAGES,
  Options,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { CloneDto } from '@Common/dto';
import { SocketTypes, _ERRORS, _MESSAGES } from '@Common/constants';
import {
  CreateIncidentMessageCenterDto,
  UpdateIncidentMessageCenterDto,
  GetIncidentMessageCenterDto,
  SnoozeIncidentMessageCenterDto,
} from './dto';
import {
  getAllIncidentMessageWhere,
  incidentMessageCenterValidation,
  sendUpdatedIncidentMessageCenter,
} from './helpers';

@Injectable()
export class IncidentMessageCenterService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly sequelize: Sequelize,
  ) {}

  async createIncidentMessageCenter(
    createIncidentMessageCenterDto: CreateIncidentMessageCenterDto,
  ) {
    const { event_id, country_code, phone_number } =
      createIncidentMessageCenterDto;

    createIncidentMessageCenterDto['country_iso_code'] =
      createIncidentMessageCenterDto['country_iso_code'].toLowerCase();

    await incidentMessageCenterValidation(event_id, country_code, phone_number);

    const messageCenter = await IncidentMessageCenter.create({
      ...createIncidentMessageCenterDto,
    });

    const messageCenterSocket = await this.getIncidentMessageCenterById(
      messageCenter.id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedIncidentMessageCenter(
      { inboxData: messageCenterSocket },
      event_id,
      'new',
      SocketTypes.INCIDENT_MESSAGE_CENTER,
      true,
      this.pusherService,
    );

    return messageCenterSocket;
  }

  async cloneIncidentMessagesInboxes(
    user: User,
    clone_incident_types: CloneDto,
  ) {
    const { clone_event_id, current_event_id } = clone_incident_types;
    let createdCount = 0;

    await withCompanyScope(user, current_event_id);

    const incidentMessages = await IncidentMessageCenter.findAll({
      where: { event_id: clone_event_id },
    });

    const mappedMessages = incidentMessages.map((data) => ({
      name: data.name,
      phone_number: data.phone_number,
      country_code: data.country_code,
      country_iso_code: data.country_iso_code,
    }));

    if (!incidentMessages.length)
      throw new NotFoundException(_ERRORS.NO_INCIDENT_MESSAGES_FOUND);

    for (const mappedMessage of mappedMessages) {
      const { name, phone_number, country_code, country_iso_code } =
        mappedMessage;

      const [created] = await IncidentMessageCenter.findOrCreate({
        where: {
          phone_number,
          event_id: current_event_id,
          country_code,
        },
        defaults: {
          name,
          country_iso_code,
        },
      });

      if (created) {
        createdCount++;
      }
    }

    if (!createdCount) return { message: _ERRORS.NO_RECORDS_CLONE };

    sendUpdatedIncidentMessageCenter(
      { message: _MESSAGES.INCIDENT_MESSAGE_INBOX_CLONE },
      current_event_id,
      'clone',
      SocketTypes.INCIDENT_MESSAGE_CENTER,
      true,
      this.pusherService,
    );

    return { message: _MESSAGES.INCIDENT_MESSAGE_INBOX_CLONE };
  }

  async getAllIncidentMessageCenters(
    getIncidentMessageCenterDto: GetIncidentMessageCenterDto,
  ) {
    const { sort_column, order, event_id } = getIncidentMessageCenterDto;

    return await IncidentMessageCenter.findAll({
      where: getAllIncidentMessageWhere(getIncidentMessageCenterDto),
      attributes: {
        include: [
          [
            Sequelize.literal(`(
                SELECT CAST(COUNT(DISTINCT conversations.id) AS INTEGER) 
                FROM conversations
                INNER JOIN messages ON conversations.message_id = messages.id
                WHERE messages.unread = true
                AND conversations.event_id = ${event_id}
                AND conversations.to_number = "IncidentMessageCenter"."phone_number"
            )`),
            'unread',
          ],
        ],
      },
      order: [[sort_column || 'createdAt', order || SortBy.ASC]],
    });
  }

  async getAllUnreadCount(event_id: number) {
    return await this.sequelize.query(
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
  }

  async getIncidentMessageCenterById(
    id: number,
    event_id: number,
    options?: Options,
  ) {
    const incidentMessageCenter = await IncidentMessageCenter.findOne({
      where: { id, event_id },
      attributes: {
        include: [
          [
            Sequelize.literal(`(
                SELECT CAST(COUNT(DISTINCT conversations.id) AS INTEGER) 
                FROM conversations
                INNER JOIN messages ON conversations.message_id = messages.id
                WHERE messages.unread = true
                AND conversations.event_id = ${event_id}
                AND conversations.to_number = "IncidentMessageCenter"."phone_number"
            )`),
            'unread',
          ],
        ],
      },
      ...options,
    });
    if (!incidentMessageCenter)
      throw new NotFoundException(ERRORS.INCIDENT_MESSAGE_CENTER_NOT_FOUND);

    return incidentMessageCenter;
  }

  async snoozeIncidentMessageCenter(
    id: number,
    snoozeIncidentMessageCenterDto: SnoozeIncidentMessageCenterDto,
  ) {
    const { event_id, snooze } = snoozeIncidentMessageCenterDto;
    const incidnetMessageCenter = await this.getIncidentMessageCenterById(
      id,
      event_id,
    );

    if (!snooze) {
      snoozeIncidentMessageCenterDto['start_time'] = null;
      snoozeIncidentMessageCenterDto['end_time'] = null;
      snoozeIncidentMessageCenterDto['snooze_message'] = null;
    }

    await incidnetMessageCenter.update({
      ...snoozeIncidentMessageCenterDto,
    });

    const messageCenter = await this.getIncidentMessageCenterById(
      id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedIncidentMessageCenter(
      { inboxData: messageCenter },
      event_id,
      'snooze',
      SocketTypes.INCIDENT_MOBILE_INBOX,
      false,
      this.pusherService,
    );

    return await this.getIncidentMessageCenterById(id, event_id, {
      useMaster: true,
    });
  }

  async updateIncidentMessageCenter(
    id: number,
    updateIncidentMessageCenterDto: UpdateIncidentMessageCenterDto,
  ) {
    const { event_id, country_code, phone_number } =
      updateIncidentMessageCenterDto;
    const incidentMessageCenter = await IncidentMessageCenter.findOne({
      where: { id, event_id },
      attributes: { exclude: ['updatedAt'] },
    });
    if (!incidentMessageCenter)
      throw new NotFoundException(ERRORS.INCIDENT_MESSAGE_CENTER_NOT_FOUND);

    await incidentMessageCenterValidation(
      event_id,
      country_code,
      phone_number,
      id,
    );

    const updatedIncidentMessageCenter = await incidentMessageCenter.update({
      ...updateIncidentMessageCenterDto,
    });
    if (!updatedIncidentMessageCenter)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    const messageCenterSocket = await this.getIncidentMessageCenterById(
      updatedIncidentMessageCenter.id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedIncidentMessageCenter(
      { inboxData: messageCenterSocket },
      event_id,
      'update',
      SocketTypes.INCIDENT_MESSAGE_CENTER,
      false,
      this.pusherService,
    );

    return messageCenterSocket;
  }

  async deleteIncidentMessageCenter(id: number, event_id: number) {
    const incidentMessageCenter = await IncidentMessageCenter.findOne({
      where: { id, event_id },
    });
    if (!incidentMessageCenter)
      throw new NotFoundException(ERRORS.INCIDENT_MESSAGE_CENTER_NOT_FOUND);

    await incidentMessageCenter.destroy();

    sendUpdatedIncidentMessageCenter(
      {
        message: MESSAGES.INCIDENT_MESSAGE_CENTER_DESTROYED_SUCCESSFULLY,
        deletedIds: [incidentMessageCenter.id],
      },
      event_id,
      'delete',
      SocketTypes.INCIDENT_MESSAGE_CENTER,
      true,
      this.pusherService,
    );

    return { message: MESSAGES.INCIDENT_MESSAGE_CENTER_DESTROYED_SUCCESSFULLY };
  }
}
