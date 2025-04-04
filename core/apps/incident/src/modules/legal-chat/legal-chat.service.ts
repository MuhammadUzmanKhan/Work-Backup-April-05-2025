import moment from 'moment-timezone';
import { Response } from 'express';
import { UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import {
  Editor,
  RESPONSES,
  PolymorphicType,
  ChatTypeEnum,
} from '@ontrack-tech-group/common/constants';
import {
  Chat,
  Incident,
  LegalGroup,
  User,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  getSubCompaniesOfGlobalAdmin,
  throwCatchError,
  withCompanyScope,
  withTryCatch,
} from '@ontrack-tech-group/common/helpers';
import {
  CommunicationService,
  PusherService,
  ChangeLogService,
} from '@ontrack-tech-group/common/services';
import {
  sendIncidentLegalUpdate,
  sendIncidentUpdate,
  sendLegalChatCount,
  sendLegalChatUpdate,
  sendLegalGroupStatusUpdate,
} from '@Modules/incident/helpers/sockets';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  getIncidentCountsForLegal,
  isIncidentExist,
} from '@Modules/incident/helpers';
import { UserWithCompanyId } from '@Common/constants/interfaces';
import { IncidentService } from '@Modules/incident/incident.service';
import {
  GetLegalChatDto,
  SendLegalMessageDto,
  UpdateLegalGroupStatusDto,
} from './dto';
import {
  emailResponseRegex,
  getLegalLogCount,
  isLegalGroupExists,
  sendLegalChatEmail,
} from './helpers';
import { getLegalChatWhereClause } from './helpers/where';

@Injectable()
export class LegalChatService {
  constructor(
    private sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly changeLogService: ChangeLogService,
    private readonly communicationService: CommunicationService,
    private readonly incidentService: IncidentService,
  ) {}

  async sendLegalMessage(sendLegalMessageDto: SendLegalMessageDto, user: User) {
    const { incident_id, is_attachment, attachment_name, message } =
      sendLegalMessageDto;

    // check if the legal group exists
    const legalGroup = await isLegalGroupExists(incident_id);

    const chat = await Chat.create({
      ...sendLegalMessageDto,
      legal_group_id: legalGroup.id,
      sender_id: user.id,
      sender_info: user.name,
    });

    // send email to the legal group
    await sendLegalChatEmail(
      this.communicationService,
      legalGroup,
      message,
      is_attachment,
      attachment_name,
    );

    // sending message to socket
    sendLegalChatUpdate(chat, incident_id, this.pusherService);

    // sending legal logs count after sending every message
    const legalLogsCount = await getLegalLogCount(legalGroup.id);

    withTryCatch(
      () =>
        sendLegalChatCount(
          legalLogsCount,
          legalGroup.incident.event_id,
          this.pusherService,
        ),
      'IncidentService',
      'sendingLegalLogsCount',
    );

    return chat;
  }

  async getLegalGroupChangeLogs(
    incident_id: number,
    paginationDto: PaginationDto,
  ) {
    const { page, page_size } = paginationDto;

    // check if the legal group exists
    const legalGroup = await isLegalGroupExists(incident_id);

    // all change logs against Legal Group
    const { data, pagination } = await this.changeLogService.getChangeLogs({
      id: legalGroup.id,
      types: [PolymorphicType.LEGAL_GROUP],
      page,
      page_size,
    });

    return {
      data,
      pagination,
    };
  }

  async getAllChatMessages(
    incident_id: number,
    getLegalChatDto: GetLegalChatDto,
  ) {
    const { page, page_size, keyword } = getLegalChatDto;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    // check if the legal group exists
    const legalGroup = await isLegalGroupExists(incident_id);

    const { count, rows: messages } = await Chat.findAndCountAll({
      where: getLegalChatWhereClause(legalGroup.id, keyword),
      attributes: {
        exclude: ['updatedAt'],
        include: [
          [Sequelize.literal('"legalGroup"."incident_id"'), 'incident_id'],
        ],
      },
      include: [
        {
          model: LegalGroup,
          attributes: [],
        },
      ],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      order: [['created_at', SortBy.DESC]],
    });

    return {
      data: messages,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async updateLegalGroupStatus(
    incident_id: number,
    updateLegalGroupStatusDto: UpdateLegalGroupStatusDto,
    user: User,
  ) {
    let chat: Chat;
    const { status, is_archived, is_concluded } = updateLegalGroupStatusDto;

    const incident = await isIncidentExist(incident_id, user);

    // Check if user has access to this event or not based on its company or subcompany
    const [companyId, divisionLockService, time_zone] = await withCompanyScope(
      user,
      incident.event_id,
    );

    // check if the legal group exists
    const legalGroup = await isLegalGroupExists(incident_id);

    const formattedTime = moment()
      .tz(time_zone)
      .format('MMM Do,YYYY | hh:mm A');

    const transaction = await this.sequelize.transaction();

    const formattedText = `${status} this conversation on ${formattedTime}`;

    try {
      // updating the status of legal group
      await LegalGroup.update({ status }, {
        where: { id: legalGroup.id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      // creating chat message for changelogs
      chat = await Chat.create(
        {
          message: formattedText,
          legal_group_id: legalGroup.id,
          type: ChatTypeEnum.CHANGELOG,
          sender_id: user.id,
          sender_info: user.name,
        },
        {
          transaction,
        },
      );

      // updating the incident legal status
      await Incident.update(
        {
          legal_changed_at: Date.now(),
          is_archived,
          is_concluded,
        },
        {
          where: { id: incident_id },
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    // fetch the updated legal group
    const updatedLegalGroup = await isLegalGroupExists(incident_id, null, {
      useMaster: true,
    });

    const socketData = updatedLegalGroup.get({ plain: true });
    delete socketData.incident;

    // sending message to socket
    sendLegalChatUpdate(chat, incident_id, this.pusherService);

    // sending message to socket
    sendLegalGroupStatusUpdate(
      socketData,
      updatedLegalGroup.incident_id,
      this.pusherService,
    );

    // sockets for incident
    const updatedIncident = await this.incidentService.getIncidentById(
      incident_id,
      incident.event_id,
      user,
      true,
      {
        useMaster: true,
      },
    );

    // getting company and subcompany ids of current logged in user
    const companyIds = !(user as UserWithCompanyId).is_super_admin
      ? await getSubCompaniesOfGlobalAdmin(user)
      : [];

    // Get the legal count for the company`
    const legalCount = await getIncidentCountsForLegal(companyIds);

    withTryCatch(
      () => {
        sendIncidentUpdate(
          updatedIncident,
          incident.event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    //sending incident update against company
    withTryCatch(
      () => {
        sendIncidentLegalUpdate(
          updatedIncident,
          false, // isNew flag
          this.pusherService,
          legalCount,
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    return { message: RESPONSES.updatedSuccessfully('Legal Group Status') };
  }

  async handleEmailWebhook(body: any, res: Response) {
    let chat: Chat;
    let legalGroup: LegalGroup;

    try {
      const { senderEmail, message, thread_id } =
        await emailResponseRegex(body);

      const user = await User.findOne({
        where: {
          email: senderEmail,
        },
        attributes: ['id', 'name', 'email'],
      });

      legalGroup = await isLegalGroupExists(null, thread_id, {
        useMaster: true,
      });

      if (!user && !legalGroup.participants.includes(senderEmail)) {
        const updatedParticipants = [...legalGroup.participants, senderEmail];

        await legalGroup.update({ participants: updatedParticipants });
      }

      // if user is not found against the email, then saving the sender email as sender_info (EXTERNAL)
      // else saving the user name as sender_info
      chat = await Chat.create({
        message,
        legal_group_id: legalGroup.id,
        sender_id: user ? user.id : null,
        sender_info: user ? user.name : senderEmail,
      });

      res.status(200).send({ success: true });
    } catch (err) {
      console.log('🚀 ~ LegalChatService ~ handleEmailWebhook ~ err:', err);
      throwCatchError(err);
    }

    // sending message to socket
    sendLegalChatUpdate(chat, legalGroup.incident_id, this.pusherService);

    // sending legal logs count after sending every message
    const legalLogsCount = await getLegalLogCount(legalGroup.id);

    withTryCatch(
      () =>
        sendLegalChatCount(
          legalLogsCount,
          legalGroup.incident.event_id,
          this.pusherService,
        ),
      'IncidentService',
      'sendingLegalLogsCount',
    );

    return true;
  }
}
