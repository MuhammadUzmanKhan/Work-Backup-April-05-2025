import { Job } from 'bull';
import { OnQueueError, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import {
  CoreService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  BullProcesses,
  BullQueues,
  ERRORS,
  EventStatus,
} from '@ontrack-tech-group/common/constants';
import { Event } from '@ontrack-tech-group/common/models';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';

@Processor(BullQueues.EVENT)
export class EventConsumer {
  constructor(
    private readonly pusherService: PusherService,
    private readonly coreService: CoreService,
  ) {}

  @Process(BullProcesses.UPDATE_STATUS)
  async scheduleEventStatusToUpdate(job: Job) {
    const { event, statusToUpdate, user } = job.data;
    console.debug('Start updating event...', event.id);

    if (!event) {
      job.moveToFailed({ message: ERRORS.EVENT_DATA_IS_MISSING });
      throw new BadRequestException(ERRORS.EVENT_DATA_IS_MISSING);
    }

    try {
      const eventLatestData = await Event.findByPk(event.id, {
        attributes: ['id', 'status'],
        useMaster: true,
      });

      if (
        statusToUpdate === BullProcesses.EVENT_IN_PROGRESS &&
        eventLatestData.status === EventStatus.UPCOMING
      ) {
        await Event.update(
          { status: EventStatus.IN_PROGRESS },
          { where: { id: event.id } },
        );

        job.moveToCompleted('done', true);

        console.debug('Event status updation completed with job id ', job.id);
      } else if (
        statusToUpdate === BullProcesses.EVENT_COMPLETED &&
        eventLatestData.status === EventStatus.IN_PROGRESS
      ) {
        await Event.update(
          { status: EventStatus.COMPLETED, event_access_lock: true },
          { where: { id: event.id } },
        );

        job.moveToCompleted('done', true);

        console.debug('Event status updation completed with job id ', job.id);
      } else job.moveToCompleted('done', true);
    } catch (err) {
      console.log(err);
      job.moveToFailed({ message: err });
    }

    try {
      const newEventFromCore: Event = await this.coreService.communicate(
        event.id,
        'get-event-by-id',
        user,
      );

      this.pusherService.sendUpdatedEvent(newEventFromCore as Event);
    } catch (e) {
      throwCatchError(e);
    }
  }

  @OnQueueFailed()
  @OnQueueError()
  onQueueError(error: Error) {
    console.log(
      `Queue '${BullQueues.EVENT}' error ${JSON.stringify(error, null, 2)}`,
    );
  }
}
