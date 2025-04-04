import { Request, Response } from 'express';
import moment from 'moment';
import { Sequelize } from 'sequelize';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { User, Note, Event } from '@ontrack-tech-group/common/models';
import {
  successInterceptorResponseFormat,
  userRoleInclude,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { isEventExist } from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  Options,
  PolymorphicType,
  RESPONSES,
  SocketTypesStatus,
} from '@ontrack-tech-group/common/constants';
import { _ERRORS, SocketTypes } from '@Common/constants';
import {
  dateGroupedData,
  getEventNotesAndScansDaysData,
  getEventsAndScansDays,
} from '@Common/helpers';
import {
  CreateEventNoteDto,
  GetAllEventNotesDto,
  UpdateEventNoteDto,
} from './dto';
import {
  eventNoteWhereCondition,
  generatePdfEventNotes,
  generatePdfForEventNotes,
  sendUpdatedEventNote,
} from './helper';

@Injectable()
export class EventNoteService {
  constructor(
    private readonly httpService: HttpService,
    private pusherService: PusherService,
  ) {}

  async createNotes(user: User, createEventNoteDto: CreateEventNoteDto) {
    const { event_id, body, is_weather_log } = createEventNoteDto;

    await withCompanyScope(user, event_id);

    const note = await Note.create({
      body,
      noteable_id: event_id,
      noteable_type: PolymorphicType.EVENT,
      user_id: user.id,
      is_weather_log,
    });

    const eventNotes = await this.getEventNoteById(note.id, event_id, {
      useMaster: true,
    });

    sendUpdatedEventNote(
      { eventNotes },
      event_id,
      SocketTypesStatus.CREATE,
      SocketTypes.EVENT_NOTE,
      true,
      this.pusherService,
    );

    return eventNotes;
  }

  async getEventNoteById(id: number, event_id: number, options?: Options) {
    const { company_id } = await isEventExist(event_id);

    const eventNote = await Note.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: [
            'id',
            'first_name',
            'last_name',
            [
              Sequelize.literal(`"user->users_companies_roles->role"."name"`),
              'role',
            ],
          ],
          include: [...userRoleInclude(company_id)],
        },
      ],
      ...options,
    });

    if (!eventNote)
      throw new NotFoundException(RESPONSES.notFound('Event Note'));

    return eventNote;
  }

  async getAllEventNotes(
    getAllEventNotesDto: GetAllEventNotesDto,
    req: Request,
    res: Response,
  ) {
    const { event_id, csv_pdf } = getAllEventNotesDto;
    const { company_id, time_zone } = await isEventExist(event_id);

    const eventNotes = await Note.findAll({
      where: eventNoteWhereCondition(getAllEventNotesDto, time_zone),
      attributes: {
        include: ['created_at', 'updated_at'],
        exclude: ['createdAt', 'updatedAt'],
      },
      include: [
        {
          model: User,
          attributes: [
            'id',
            'first_name',
            'last_name',
            [
              Sequelize.literal(`"user->users_companies_roles->role"."name"`),
              'role',
            ],
          ],
          include: [...userRoleInclude(company_id)],
        },
      ],
    });

    const dateGroupData = dateGroupedData(
      eventNotes.map((notes) => notes.get({ plain: true })),
    );

    if (csv_pdf) {
      return await generatePdfForEventNotes(
        getAllEventNotesDto,
        event_id,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: dateGroupData,
      }),
    );
  }

  async getAllEventNoteDays(event_id: number) {
    const { start_date, end_date } = await isEventExist(event_id);
    let eventData;

    const eventNotes = await Note.findAll({
      where: { noteable_id: event_id },
      attributes: ['id', 'created_at'],
      raw: true,
    });

    eventData = getEventsAndScansDays(start_date, end_date, eventNotes);

    if (eventNotes.length) {
      eventData = getEventNotesAndScansDaysData(eventNotes, eventData);
    }

    return eventData;
  }

  async getAllEventNotesPdf(
    getAllEventNotesDto: GetAllEventNotesDto,
    req: Request,
    res: Response,
    user: User,
  ) {
    const { event_id, csv_pdf } = getAllEventNotesDto;
    if (!csv_pdf) {
      throw new BadRequestException(_ERRORS.CSV_PDF_REQUIRED);
    }
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const event = await Event.findOne({
      where: { id: event_id },
      attributes: [
        'id',
        'name',
        [
          Sequelize.literal(`to_char(start_date, 'FMMM/FMDD/YY')`),
          'start_date',
        ],
        [Sequelize.literal(`to_char(end_date, 'FMMM/FMDD/YY')`), 'end_date'],
        'event_location',
        'time_zone',
      ],
      include: [
        {
          model: Note,
          where: eventNoteWhereCondition(getAllEventNotesDto, time_zone),
          attributes: ['body', 'createdAt'],
          required: false,
          include: [
            {
              model: User,
              attributes: ['id', 'first_name', 'last_name'],
            },
          ],
        },
      ],
      order: [[{ model: Note, as: 'event_notes' }, 'createdAt']],
    });
    return await generatePdfEventNotes(
      getAllEventNotesDto,
      event.get({ plain: true }),
      req,
      res,
      this.httpService,
    );
  }

  async updateEventNote(id: number, updateEventNoteDto: UpdateEventNoteDto) {
    const { event_id } = updateEventNoteDto;
    const eventNote = await Note.findOne({
      where: { id, noteable_id: event_id },
      attributes: ['id', 'last_broadcast_time', 'noteable_id'],
    });

    const { is_broadcasted } = updateEventNoteDto;
    let last_broadcast_time;

    if (!eventNote)
      throw new NotFoundException(RESPONSES.notFound('Event Note'));

    if (is_broadcasted !== undefined) {
      last_broadcast_time = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    await eventNote.update({
      ...updateEventNoteDto,
      is_updated: true,
      last_broadcast_time:
        is_broadcasted !== undefined
          ? last_broadcast_time
          : eventNote?.last_broadcast_time,
    });

    const eventNotes = await this.getEventNoteById(id, event_id, {
      useMaster: true,
    });

    sendUpdatedEventNote(
      { eventNotes },
      event_id,
      SocketTypesStatus.UPDATE,
      SocketTypes.EVENT_NOTE,
      false,
      this.pusherService,
    );

    return eventNotes;
  }
}
