// queue.processor.ts
import { Job } from 'bull';
import { Processor, Process } from '@nestjs/bull';
import { ConstantsHelper } from '@Common/helpers';
import { QueueEventJobInterface } from '@CommonInterface';
import { EventProvider } from '@Modules/event/event.provider';

@Processor(ConstantsHelper.EVENT_CLONING_QUEUE)
export class QueueProcessor {
  constructor(private readonly eventProvider: EventProvider) {}
  @Process('eventAssociation')
  async handleEventAssociationJob(job: Job<QueueEventJobInterface>) {
    const { id, newEvent, user } = job.data;

    await this.eventProvider.eventAssociations(id, newEvent, user);
  }

  @Process('importAssociation')
  async handleImportAssociation(job: Job<QueueEventJobInterface>) {
    const { id, newEvent, user } = job.data;

    await this.eventProvider.eventDisAssociation(id, newEvent, user);
  }
}
