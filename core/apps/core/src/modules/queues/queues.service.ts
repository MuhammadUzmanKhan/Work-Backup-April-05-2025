import { Job, Queue } from 'bull';
import { Op } from 'sequelize';
import { InjectQueue, OnQueueActive, OnQueueError } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, User } from '@ontrack-tech-group/common/models';
import {
  BullProcesses,
  BullQueues,
  EventStatusAPI,
  MILLI_SECONDS_FORTY_EIGHT_HOURS,
} from '@ontrack-tech-group/common/constants';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue(BullQueues.EVENT) private eventQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async scheduleEventStatus(_event: Event, user: User) {
    if (this.configService.get('AUTOMATION_DEPLOYMENT') === 'true') {
      const event = _event.get({ plain: true });

      // Check if both public start and end date are in past
      if (!this.checkIfEventDatesAreValid(event)) return;

      console.log(`Creating job in queue ${BullQueues.EVENT}`);

      // Finding already created jobs to be deleted
      const alreadyCreatedJob = await this.getAlreadyCreatedJob(event);

      if (alreadyCreatedJob.length) {
        // Deleting already created jobs so on event update we can create new jobs.
        await alreadyCreatedJob[0].remove();
        alreadyCreatedJob[1] && (await alreadyCreatedJob?.[1].remove());
      }

      if (event.status.toString() !== EventStatusAPI.ON_HOLD) {
        const startDateJob = await this.eventQueue.add(
          BullProcesses.UPDATE_STATUS,
          {
            event,
            statusToUpdate: BullProcesses.EVENT_IN_PROGRESS,
            user,
          },
          {
            delay:
              new Date(
                this.getCurrentDateTimeForTimezone(
                  event.time_zone,
                  event.public_start_date,
                ),
              ).getTime() -
              new Date(
                this.getCurrentDateTimeForTimezone(event.time_zone),
              ).getTime(),
          }, // Delay will have milliseconds from now to public start date
        );
        console.log(
          `created job "${BullProcesses.EVENT_IN_PROGRESS}" in queue "${BullQueues.EVENT}" with job id ${startDateJob.id}`,
        );

        const endDateJob = await this.eventQueue.add(
          BullProcesses.UPDATE_STATUS,
          {
            event,
            statusToUpdate: BullProcesses.EVENT_COMPLETED,
            user,
          },
          {
            delay:
              new Date(
                this.getCurrentDateTimeForTimezone(
                  event.time_zone,
                  event.public_end_date,
                ),
              ).getTime() +
              MILLI_SECONDS_FORTY_EIGHT_HOURS -
              new Date(
                this.getCurrentDateTimeForTimezone(event.time_zone),
              ).getTime(),
          },
        );
        console.log(
          `created job "${BullProcesses.EVENT_COMPLETED}" in queue "${BullQueues.EVENT}" with job id ${endDateJob.id}, Event ID: ${event.id}`,
        );
      }

      return;
    }
  }

  async tempScheduleEventStatus(user: User, defaultDelay: number) {
    if (this.configService.get('AUTOMATION_DEPLOYMENT') === 'true') {
      try {
        const events = await this.fetchEvents();

        const filteredEvents: Event[] = events.filter((event: Event) =>
          this.checkIfEventDatesAreValid(event, true),
        );

        if (!filteredEvents.length) {
          return 0;
        }

        const eventIds = filteredEvents.map((event: Event) =>
          Number(event.dataValues.id),
        );

        await this.removeAlreadyCreatedJobs(eventIds);

        for (const event of filteredEvents) {
          await this.createJobsForEvent(event, user, defaultDelay);
        }

        return filteredEvents.length;
      } catch (error) {
        console.error('Error scheduling event status:', error);
        throw error;
      }
    }
  }

  async fetchEvents() {
    return Event.findAll({
      where: {
        status: {
          [Op.notIn]: [0, 1],
        },
      },
      attributes: [
        'id',
        'status',
        'public_start_date',
        'public_end_date',
        'time_zone',
      ],
    });
  }

  getCurrentDateTimeForTimezone(
    timezone: string,
    date: null | string | Date = null,
  ) {
    const now: Date = date ? new Date(date) : new Date();
    return timezone
      ? now.toLocaleString('en-US', { timeZone: timezone })
      : now.toLocaleString('en-US');
  }

  async removeAlreadyCreatedJobs(eventIds: number[]) {
    const alreadyCreatedJobs = await this.getTempAlreadyCreatedJob(eventIds);
    console.log('Length:', alreadyCreatedJobs.length);
    if (alreadyCreatedJobs.length) {
      for (const job of alreadyCreatedJobs) {
        await job.remove();
        console.log('Removed Job ID:', job.id);
      }
    }
  }

  async createJobsForEvent(event, user: User, defaultDelay: number) {
    console.log('Status: ', event.status);
    if (event.status !== 2) {
      const startDateJob = await this.createJob(
        event,
        BullProcesses.EVENT_IN_PROGRESS,
        event.public_start_date,
        user,
      );
      if (startDateJob) {
        console.log(
          `Created job "${BullProcesses.EVENT_IN_PROGRESS}" in queue "${BullQueues.EVENT}" with job ID ${startDateJob.id}`,
        );
      }

      const endDateJob = await this.createJob(
        event,
        BullProcesses.EVENT_COMPLETED,
        event.public_end_date,
        user,
        defaultDelay,
      );
      if (endDateJob) {
        console.log(
          `Created job "${BullProcesses.EVENT_COMPLETED}" in queue "${BullQueues.EVENT}" with job ID ${endDateJob.id}`,
        );
      }
    } else {
      const endDateJob = await this.createJob(
        event,
        BullProcesses.EVENT_COMPLETED,
        event.public_end_date,
        user,
        defaultDelay,
      );
      if (endDateJob) {
        console.log(
          `Created job "${BullProcesses.EVENT_COMPLETED}" in queue "${BullQueues.EVENT}" with job ID ${endDateJob.id}`,
        );
      }
    }
  }

  async createJob(
    event: Event,
    statusToUpdate: BullProcesses,
    date: string,
    user: User,
    additionalDelay: number = -1,
  ) {
    if (!date) {
      console.warn(
        `Event ${event.id} does not have a valid date for status "${statusToUpdate}"`,
      );
      return null;
    }

    const delayTime: number =
      new Date(
        this.getCurrentDateTimeForTimezone(event.time_zone, date),
      ).getTime() +
      additionalDelay -
      new Date(this.getCurrentDateTimeForTimezone(event.time_zone)).getTime();

    const delay =
      additionalDelay === -1
        ? delayTime
        : delayTime < 0
          ? additionalDelay
          : delayTime;

    return this.eventQueue.add(
      BullProcesses.UPDATE_STATUS,
      { event, statusToUpdate, user },
      { delay },
    );
  }

  async sendEventPlanNotification(notificationData) {
    return await this.eventQueue.add(
      BullProcesses.SEND_EVENT_PLAN_NOTIFICATION,
      {
        notificationData,
      },
    );
  }

  @OnQueueActive()
  onQueueActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnQueueError()
  onQueueError(error: Error) {
    console.log(`Queue '${BullQueues.EVENT}' error ${error}`);
  }

  private async getAlreadyCreatedJob(data: any) {
    const jobs = await this.eventQueue.getJobs([
      'active',
      'waiting',
      'delayed',
    ]);
    const matchingJobs = jobs.filter((job) => job.data.event.id === data.id);

    return matchingJobs;
  }

  private async getTempAlreadyCreatedJob(ids: number[]) {
    const jobs = await this.eventQueue.getJobs([
      'active',
      'waiting',
      'delayed',
    ]);

    return jobs.filter((job) => ids.includes(job.data.event.id));
  }

  private checkIfEventDatesAreValid(event: Event, isTemporary = false) {
    const currentDateTimeForTimezone: number = new Date(
      this.getCurrentDateTimeForTimezone(event.time_zone),
    ).getTime();

    const publicStartDate: number = new Date(
      this.getCurrentDateTimeForTimezone(
        event.time_zone,
        event.public_start_date,
      ),
    ).getTime();

    const publicEndDate: number = new Date(
      this.getCurrentDateTimeForTimezone(
        event.time_zone,
        event.public_end_date,
      ),
    ).getTime();

    return event.status === (isTemporary ? 2 : EventStatusAPI.IN_PROGRESS)
      ? publicEndDate >= currentDateTimeForTimezone
      : publicStartDate >= currentDateTimeForTimezone;
  }
}
