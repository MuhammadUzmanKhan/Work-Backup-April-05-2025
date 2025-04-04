import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import {
  CommunicationService,
  CoreService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { User, Event } from '@ontrack-tech-group/common/models';
import {
  addTasksAndAttachments,
  formatDate,
} from '@ontrack-tech-group/common/helpers';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import {
  PusherEvents,
  PusherChannels,
} from '@ontrack-tech-group/common/constants';
import { ClonerHelper, CommonHelper } from '@Common/helpers';
import { QueueService } from '@Modules/queue/queue.service';
import { CloneEventDto, ImportEventDto } from '@Modules/event/dto';
import {
  findCommonEventNames,
  updateEventCloneFlag,
} from '@Modules/event/helper';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event) readonly event: typeof Event,
    @InjectModel(User) readonly user: typeof User,
    private readonly pusherService: PusherService,
    private readonly queueService: QueueService,
    private readonly coreService: CoreService,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
    private readonly communicationService: CommunicationService,
  ) {}

  async cloneEvent(id: number, data: CloneEventDto, user: User) {
    let newEvent: Event;
    const { start_date, end_date, name } = data;

    const originalEvent = await ClonerHelper.getEventById(id);
    if (!originalEvent) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const transaction: Transaction = await this.sequelize.transaction();

    try {
      const eventName = CommonHelper.extractEventName(originalEvent.name);
      const allCommonNames = await findCommonEventNames(eventName);
      const maxClonedNumber = CommonHelper.findMaxCloneNumber(allCommonNames);
      const clonedEventData = {
        ...CommonHelper.createPlainObject(originalEvent),
        public_start_date: start_date,
        start_date,
        public_end_date: end_date,
        end_date,
        cloned: false,
        status: 3, // 3 is an enum equal to upcoming
        public_start_time: '00:00:00',
        start_time: '00:00:00',
        public_end_time: '23:59:00',
        end_time: '23:59:00',
        name: name || `[Clone ${maxClonedNumber}] ${eventName}`,
      };

      newEvent = await this.event.create(clonedEventData, {
        transaction,
        // Pass the `isCloned` property externally in the options
        isCloned: true,
      });

      // Cloning Tasks for Live Nation Documents
      if (this.configService.get('ENV') === 'prod') {
        await addTasksAndAttachments(
          newEvent.company_id,
          newEvent.id,
          user,
          transaction,
        );
      }

      await transaction.commit();
    } catch (error) {
      /*
        In case of any error while creation of Association it
        will roll back all changes after destruction of event and
        will emit a socket for Failure message
      */
      console.log('ERROR ->', error.message);
      await transaction.rollback();
      throw new HttpException(
        'Error while cloning event!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const newEventFromCore: Event = await this.coreService.communicate(
      newEvent.id,
      'get-event-by-id',
      user,
    );

    if (
      newEventFromCore['statusCode'] &&
      newEventFromCore['statusCode'] === 404
    ) {
      throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);
    }

    await this.queueService.cloneEventSvc(id, newEventFromCore, user);

    this.pusherService.sendDataUpdates(
      PusherChannels.EVENTS_CHANNEL,
      [PusherEvents.ALL, newEvent.id.toString()],
      newEventFromCore,
    );

    // Slack Update on Clone Event
    try {
      // update the date as per the format of front end
      const startDate = formatDate(newEventFromCore.public_start_date);
      const endDate = formatDate(newEventFromCore.public_end_date);

      const plainedOriginalEvent = originalEvent.get({ plain: true });

      const eventDates = `${startDate} - ${endDate}`;

      const requesterInfo = `(Cloned by: ${user.name ? user.name : 'N/A'}${user.email ? ` - ${user.email}` : ''})\n\n`;

      await this.communicationService.communication(
        {
          text: `<!channel> *[Update]*\n\n${requesterInfo}New *EVENT CLONED* from ${plainedOriginalEvent['company_name']}: ${newEventFromCore.name} - ${eventDates}. :link:`,
        },
        'slack-event-update',
      );
    } catch (err) {
      console.log('🚀 ~ Error on Slack Event Update - Clone Event ~ err:', err);
    }

    return newEventFromCore;
  }

  async importEvent(id: number, data: ImportEventDto, user: User) {
    const { source_event_id } = data;

    // checking current event exist or not
    const currentEvent: Event = await ClonerHelper.getEventById(id);
    if (!currentEvent) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    // checking source event exist or not
    const sourceEvent: Event = await ClonerHelper.getEventById(source_event_id);
    if (!sourceEvent) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    // Setting import check to false
    await updateEventCloneFlag(id, true, false);

    const event: Event = await this.coreService.communicate(
      id,
      'get-event-by-id',
      user,
    );

    this.pusherService.sendDataUpdates(
      PusherChannels.EVENTS_CHANNEL,
      [PusherEvents.ALL, event.id.toString()],
      event,
    );

    await this.queueService.importEventSvc(sourceEvent.id, event, user);

    return event;
  }
}
