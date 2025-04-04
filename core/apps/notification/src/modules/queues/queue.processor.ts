import { Processor, Process } from '@nestjs/bull';
import {
  BullProcesses,
  BullQueues,
} from '@ontrack-tech-group/common/constants';
import { Job } from 'bull';
import { Notification } from '@ontrack-tech-group/common/models';
import { Op } from 'sequelize';

@Processor(BullQueues.NOTIFICATION)
export class QueueProcessor {
  constructor() {}

  @Process(BullProcesses.DELETE_NOTIFICATION)
  async handleDeleteOldNotifications(job: Job) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    console.log(`Deleting notifications older than: ${cutoffDate}`);

    const result = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate, // Notifications older than 30 days
        },
      },
    });

    console.log(`Deleted ${result} notifications.`);
  }
}
