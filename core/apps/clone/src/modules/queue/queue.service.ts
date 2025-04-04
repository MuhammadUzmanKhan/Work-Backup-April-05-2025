// queue.service.ts
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Event, User } from '@ontrack-tech-group/common/models';
import { ConstantsHelper } from '@Common/helpers';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(ConstantsHelper.EVENT_CLONING_QUEUE)
    private readonly eventCloningQueue: Queue,
  ) {}

  async cloneEventSvc(
    eventId: number,
    newEvent: Event,
    user: User,
  ): Promise<void> {
    await this.eventCloningQueue.add('eventAssociation', {
      id: eventId,
      newEvent,
      user,
    });
  }

  async importEventSvc(
    eventId: number,
    newEvent: Event,
    user: User,
  ): Promise<void> {
    await this.eventCloningQueue.add('importAssociation', {
      id: eventId,
      newEvent,
      user,
    });
  }

  async getActiveProccesses() {
    return await this.eventCloningQueue.getActive();
  }
}
