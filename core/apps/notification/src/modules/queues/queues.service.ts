import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  BullProcesses,
  BullQueues,
} from '@ontrack-tech-group/common/constants';

@Injectable()
export class QueueService implements OnModuleInit {
  constructor(
    @InjectQueue(BullQueues.NOTIFICATION) private notificationQueue: Queue,
  ) {}
  //it will create a job to delete notification older than 30 days every day at 12:00 AM
  async onModuleInit() {
    // Add the job to the queue on app startup
    await this.notificationQueue.add(
      BullProcesses.DELETE_NOTIFICATION,
      {},
      {
        jobId: 'delete_old_notifications_job', // Unique identifier
        repeat: { cron: '0 0 * * *' }, // Daily at midnight
      },
    );

    console.log('Scheduled daily job to clean up old notifications.');
  }
}
