import { Sequelize } from 'sequelize-typescript';
import {
  BulkCreateOptions,
  UpdateOptions,
  Transaction,
  CreateOptions,
} from 'sequelize';
import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Editor,
  ERRORS,
  EventCadType,
  Options,
  SortBy,
  TemplateNames,
} from '@ontrack-tech-group/common/constants';
import {
  ChangeLogService,
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  Cad,
  Event,
  EventCad,
  Image,
  User,
} from '@ontrack-tech-group/common/models';
import {
  isEventExist,
  throwCatchError,
} from '@ontrack-tech-group/common/helpers';
import { formatDate } from '@Common/helpers';
import { EventService } from '@Modules/event/event.service';
import {
  CreateEventCadDto,
  CreateEventCadInEventDto,
  UpdateEventCadDto,
  UpdateEventCadVersionDto,
} from './dto';

@Injectable()
export class EventCadService {
  constructor(
    @Inject(forwardRef(() => EventService)) // Resolving circular dependency
    private readonly eventsService: EventService,
    private readonly pusherService: PusherService,
    private readonly changeLogService: ChangeLogService,
    private readonly communicationService: CommunicationService,
    private sequelize: Sequelize,
  ) {}

  public async createEventCad(
    user: User,
    createEventCadDto: CreateEventCadDto,
  ) {
    let newVersion: number;
    let eventCad: EventCad;
    const { event_id, type } = createEventCadDto;

    const event = (await isEventExist(event_id)).get({ plain: true });

    const existingCad = await EventCad.findOne({
      attributes: ['version'],
      where: {
        event_id,
        type,
      },
      order: [['version', 'DESC']],
      raw: true,
    });

    const transaction = await this.sequelize.transaction();

    try {
      if (existingCad) {
        await EventCad.update({ current_version: false }, {
          where: {
            current_version: true,
            event_id,
            type,
          },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });
        newVersion = parseFloat((existingCad.version + 0.1).toFixed(1));
      } else {
        newVersion = 1.0;
      }

      createEventCadDto['version'] = newVersion;
      createEventCadDto['current_version'] = true;

      eventCad = await EventCad.create(
        {
          ...createEventCadDto,
          created_by: user.id,
          created_by_name: user.name,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.sendRealTimeData(event_id, user);

    // update the date as per the format of front end
    const startDate = formatDate(event.public_start_date);
    const endDate = formatDate(event.public_end_date);

    const eventDates = `${startDate} - ${endDate}`;

    // Email notification on Uploading new CAD
    try {
      const uploadCad = {
        eventDates,
        name: eventCad.name,
        message: `Event Cad '${eventCad.name}' has been Uploaded By '${user.name}'`,
        eventName: event.name,
        company: event['company_name'],
      };

      await this.communicationService.communication(
        {
          data: uploadCad,
          template: TemplateNames.UPLOAD_CAD,
          subject: 'New CAD Uploaded',
        },
        'send-email',
      );
    } catch (err) {
      console.log('🚀 ~ Error on sending Email - Upload Cad ~ err:', err);
    }

    // SLACK notification on Uploading new CAD
    try {
      let requesterInfo = '';
      const { name, email } = user;

      if (name || email) {
        requesterInfo = `(Requested by: ${name ? name : 'N/A'}${email ? ` - ${email}` : ''})\n\n`;
      }

      await this.communicationService.communication(
        {
          text: `<!channel> *[Update]*\n\n${requesterInfo}New *CAD REQUEST* (${eventCad.name}) from ${event['company_name']}: ${event.name} - ${eventDates} :world_map:`,
        },
        'slack-event-update',
      );
    } catch (err) {
      console.log(
        '🚀 ~ Error on Slack Event Update - Update Request Event Status ~ err:',
        err,
      );
    }

    return eventCad;
  }

  // This function is used publically in event service
  public async bulkCreateEventCad(
    createEventCadDto: CreateEventCadInEventDto[],
    event_id: number,
    user: User,
    transaction?: Transaction,
    options?: Options,
  ) {
    if (!createEventCadDto?.length) return;

    let newVersion = 1.0;
    const eventCadsToCreate = [];
    const type = EventCadType.CAD_FILE_1;
    const toUpdateCads = createEventCadDto.filter((cads) => cads.id);
    const filteredCads = createEventCadDto.filter((cads) => !cads.id);

    if (filteredCads.length) {
      const existingCad = await EventCad.findOne({
        attributes: ['version'],
        where: {
          event_id,
          type,
        },
        order: [['version', 'DESC']],
        ...options,
      });

      if (existingCad) {
        await EventCad.update({ current_version: false }, {
          where: {
            current_version: true,
            event_id,
            type,
          },
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          individualHooks: true,
        } as UpdateOptions & { editor: Editor });
        newVersion = parseFloat((existingCad.version + 0.1).toFixed(1));
      }

      for (let i = 0; i < filteredCads.length; i++) {
        const cad = {
          ...filteredCads[i],
          type,
          event_id,
          created_by: user.id,
          created_by_name: user.name,
        };
        cad['current_version'] = false;

        if (i == 0) {
          cad['version'] = newVersion;
        } else {
          newVersion = parseFloat((newVersion + 0.1).toFixed(1));
          cad['version'] = newVersion;
        }

        if (i === filteredCads.length - 1) {
          cad['current_version'] = true;
        }

        eventCadsToCreate.push(cad);
      }

      const eventCads = await EventCad.bulkCreate(eventCadsToCreate, {
        returning: true,
        transaction,
        editor: { editor_id: user.id, editor_name: user.name },
      } as BulkCreateOptions & { editor: Editor });

      await Promise.all(
        toUpdateCads.map(({ id, name }) => {
          return EventCad.update({ name }, {
            where: { id },
            transaction,
            individualHooks: true,
            editor: { editor_id: user.id, editor_name: user.name },
          } as UpdateOptions & { editor: Editor });
        }),
      );

      return eventCads;
    }
  }

  async getAllCads(event_id: number) {
    await isEventExist(event_id);

    return await Cad.findAll({
      where: { event_id },
      attributes: [
        'id',
        'cad_type_id',
        'event_id',
        'name',
        'location',
        'updated_at',
        [Sequelize.literal('"images"."name"'), 'image_name'],
        [Sequelize.literal('"images"."url"'), 'image_url'],
        [
          Sequelize.literal(`(
            SELECT "event_cads"."version"
            FROM "event_cads" where "event_cads"."event_id" = ${event_id}
            ORDER BY "event_cads"."created_at" DESC
            LIMIT 1
          )`),
          'latest_version',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Event,
          attributes: ['id', 'name'],
          include: [
            {
              model: EventCad,
              attributes: ['id', 'version', 'current_version'],
              required: false,
            },
          ],
        },
      ],
    });
  }

  async getAllEventCads(event_id: number) {
    await isEventExist(event_id);

    return await EventCad.findAll({
      where: { event_id },
      attributes: { exclude: ['updatedAt', 'created_by'] },
      order: [['version', SortBy.DESC]], // Order by version descending
    });
  }

  public async updateEventCadVersion(
    id: number,
    user: User,
    updateEventCadVersionDto: UpdateEventCadVersionDto,
  ) {
    const { event_id, type } = updateEventCadVersionDto;

    // checking if event exists
    await isEventExist(event_id);

    const eventCad = await EventCad.findOne({
      attributes: ['id'],
      where: { id },
    });
    if (!eventCad) throw new NotFoundException(ERRORS.EVENT_CAD_NOT_FOUND);

    const transaction = await this.sequelize.transaction();

    try {
      // update the current version of the cad to false where current version is true
      await EventCad.update({ current_version: false }, {
        where: {
          current_version: true,
          event_id,
          type,
        },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await EventCad.update({ current_version: true }, {
        where: {
          id,
        },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.sendRealTimeData(event_id, user);

    return { success: true };
  }

  public async updateEventCadData(
    id: number,
    user: User,
    updateEventCadDto: UpdateEventCadDto,
  ) {
    const { event_id, type, version, url } = updateEventCadDto;

    // checking if event exists
    await isEventExist(event_id);

    const existingCad = await EventCad.findOne({
      attributes: ['id'],
      where: {
        event_id,
        type,
        version,
        url,
      },
      raw: true,
    });

    const transaction = await this.sequelize.transaction();

    try {
      if (existingCad) {
        await EventCad.update({ ...updateEventCadDto, current_version: true }, {
          where: {
            id,
          },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });
      } else {
        const version = await EventCad.findOne({
          attributes: ['version'],
          where: {
            event_id,
            type,
          },
          order: [['version', 'DESC']],
          raw: true,
        });

        await EventCad.update({ current_version: false }, {
          where: {
            current_version: true,
            event_id,
            type,
          },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });

        const newVersion = parseFloat((version.version + 0.1).toFixed(1));
        updateEventCadDto['version'] = newVersion;
        updateEventCadDto['current_version'] = true;

        await EventCad.create(
          {
            ...updateEventCadDto,
          },
          {
            transaction,
            editor: { editor_id: user.id, editor_name: user.name },
          } as CreateOptions & {
            editor: Editor;
          },
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.sendRealTimeData(event_id, user);

    return { success: true };
  }

  private async getEventCadById(id: number, options?: Options) {
    const eventCad = await EventCad.findByPk(id, { ...options });
    if (!eventCad) throw new NotFoundException(ERRORS.EVENT_CAD_NOT_FOUND);

    return eventCad;
  }

  private async sendRealTimeData(event_id: number, user: User) {
    const event = await this.eventsService.getEventById(event_id, user);
    this.pusherService.sendUpdatedEvent(event as Event);
  }
}
