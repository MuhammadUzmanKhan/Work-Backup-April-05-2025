import { Queue } from 'bull';
import moment from 'moment-timezone';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Preset, User } from '@ontrack-tech-group/common/models';
import {
  BullProcesses,
  BullQueues,
} from '@ontrack-tech-group/common/constants';
import { ReportingFrequency } from '@Common/constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(BullQueues.REPORTING) private reportingQueue: Queue,
  ) {}

  async schedulePreset(preset: Preset, user: User) {
    console.log(`Creating job in queue ${BullQueues.REPORTING}`);

    await this.clearExistingJobs(preset.id);

    const isDisabled = (!preset.csv && !preset.pdf) || preset.disabled;

    if (preset.frequency === ReportingFrequency.EVERY_DAY && !isDisabled) {
      const { public_start_date, public_end_date, time_zone } = preset.event;
      const currentTimestamp = moment().tz(time_zone);
      const dateRange = this.generateDateRange(
        public_start_date,
        public_end_date,
        time_zone,
        preset.export_time,
      );

      for (const date of dateRange) {
        if (moment(date).isAfter(currentTimestamp)) {
          await this.createJob(preset, user, date, currentTimestamp);
        }
      }
    } else if (
      preset.frequency === ReportingFrequency.EVENT_COMPLETION &&
      !isDisabled
    ) {
      const currentTimestamp = moment();
      await this.createJob(
        preset,
        user,
        currentTimestamp.add(preset.buffer, 'hours'),
        currentTimestamp,
      );
    }

    return;
  }

  async clearExistingJobs(id: number) {
    const existingJobs = await this.getExistingJobs(id);
    for (const job of existingJobs) {
      try {
        await job.remove();
        console.log('Removed Job ID:', job.id);
      } catch (e) {
        console.log(e);
      }
    }
  }

  private async getExistingJobs(presetId: number) {
    const jobs = await this.reportingQueue.getJobs([
      'waiting',
      'active',
      'delayed',
      'failed',
      'paused',
    ]);
    return jobs.filter((job) => job.data.preset?.id === presetId);
  }

  /**
   * This function will get date range and time on which email should be send and
   * check if current time is before all these dates and time
   * @param startDate
   * @param endDate
   * @param timezone
   * @param time
   * @returns An array of
   */
  private generateDateRange(
    startDate: Date,
    endDate: Date,
    timezone: string,
    time: string,
  ): string[] {
    const start = moment.tz(startDate, timezone).startOf('day');
    const end = moment.tz(endDate, timezone).endOf('day');
    const [hour, minute, second] = time?.split(':').map(Number);
    const dates = [];

    while (start.isSameOrBefore(end)) {
      dates.push(start.clone().set({ hour, minute, second }).toISOString());
      start.add(1, 'day');
    }

    return dates;
  }

  private async createJob(
    preset: Preset,
    user: User,
    date: string | moment.Moment,
    currentTimestamp: moment.Moment,
  ) {
    const delay = moment(date).diff(currentTimestamp);
    const job = await this.reportingQueue.add(
      BullProcesses.REPORTING_SCHEDULE,
      { preset, user },
      { delay },
    );
    console.log(
      `Created job "${BullProcesses.REPORTING_SCHEDULE}" with job ID ${job.id}`,
    );
  }

  async sendEmailOrSchedule(
    emailNowPresets: Preset[],
    schedulePresets: Preset[],
  ) {
    return await this.reportingQueue.add(BullProcesses.SEND_EMAIL_OR_SCHEDULE, {
      emailNowPresets,
      schedulePresets,
    });
  }
}
