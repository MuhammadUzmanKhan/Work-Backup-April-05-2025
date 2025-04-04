import { Request, Response } from 'express';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import {
  CsvOrPdf,
  PdfTypes,
  PolymorphicType,
  PusherChannels,
  PusherEvents,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { Event, Note, User } from '@ontrack-tech-group/common/models';
import { getStartEndTimezoneUtc } from '@ontrack-tech-group/common/helpers';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { GetAllEventNotesDto } from '../dto';

export const eventNoteWhereCondition = (
  getAllEventNotesDto: GetAllEventNotesDto,
  time_zone?: string,
) => {
  const _where = {};

  const { filter_by_date, start_date, end_date, event_id, keyword } =
    getAllEventNotesDto;

  _where['noteable_id'] = event_id;

  _where['noteable_type'] = PolymorphicType.EVENT;

  if (filter_by_date && time_zone) {
    const { startDate, endDate } = getStartEndTimezoneUtc(
      filter_by_date,
      time_zone,
    );

    _where['created_at'] = { [Op.between]: [startDate, endDate] };
  }

  if (start_date && end_date) {
    const endDatePlusOne = new Date(end_date);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1); // Increment end_date by one day

    _where[Op.or] = [
      {
        created_at: {
          [Op.gte]: start_date, // Greater than or equal to start_date
          [Op.lt]: endDatePlusOne, // Less than the day after end_date
        },
      },
    ];
  }

  if (keyword) {
    _where[Op.or] = [
      { body: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$user.first_name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$user.last_name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { '$user.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export const generatePdfForEventNotes = async (
  eventNotesPdfDto: GetAllEventNotesDto,
  event_id: number,
  req: Request,
  res: Response,
  httpService,
) => {
  const { file_name } = eventNotesPdfDto;

  const event = await Event.findOne({
    where: { id: event_id },
    attributes: [
      'id',
      'name',
      'start_date',
      'end_date',
      'event_location',
      'time_zone',
    ],
    include: [
      {
        model: Note,
        where: eventNoteWhereCondition(eventNotesPdfDto),
        attributes: ['body', 'createdAt'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'first_name', 'last_name'],
          },
        ],
      },
    ],
    order: [
      [{ model: Note, as: 'event_notes' }, 'createdAt', SortBy.DESC], // Sort notes by created_at in descending order
    ],
  });

  // Formatting data for pdf
  const formattedEventNotesDataForPdf = getFormattedEventNotesDataForPdf(event);

  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedEventNotesDataForPdf,
    CsvOrPdf.PDF,
    PdfTypes.EVENT_NOTES,
    file_name,
  );

  return res.send(response.data);
};

const getFormattedEventNotesDataForPdf = (event: Event) => {
  const { name, start_date, end_date, event_location } = event;
  return {
    name,
    start_date,
    end_date,
    event_location,
    event_notes: event?.event_notes.map((note) => {
      const {
        body,
        user: { name },
        createdAt,
      } = note;
      return {
        body,
        name,
        createdAt: moment(createdAt).format('MM/DD/YY - hh:mm A'),
      };
    }),
  };
};

export const generatePdfEventNotes = async (
  eventNotesPdfDto: GetAllEventNotesDto,
  event: Event,
  req: Request,
  res: Response,
  httpService,
) => {
  const { file_name } = eventNotesPdfDto;

  const formattedEventNotesDataForPdf = getFormattedEventNotesDataPdf(event);

  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedEventNotesDataForPdf,
    CsvOrPdf.PDF,
    PdfTypes.EVENT_NOTES,
    file_name,
  );

  return res.send(response.data);
};

const getFormattedEventNotesDataPdf = (event: Event) => {
  const { event_notes, time_zone } = event;
  return {
    ...event,
    event_notes: event_notes.map(({ body, user, createdAt }) => {
      return {
        body,
        user,
        created_at: moment(createdAt)
          .tz(time_zone)
          .format('MM/DD/YY - hh:mm A'),
      };
    }),
  };
};

export function sendUpdatedEventNote(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.EVENT_NOTE}-${event_id}`,
    [PusherEvents.INCIDENT],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
