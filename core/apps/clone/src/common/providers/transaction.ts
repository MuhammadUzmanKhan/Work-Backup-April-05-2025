import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  ERRORS,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import {
  CoreService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { Event, User } from '@ontrack-tech-group/common/models';

@Injectable()
export class TransactionProvider {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly coreService: CoreService,
    @InjectModel(Event) readonly event: typeof Event,
  ) {}

  async withTransaction(
    event: Event, // Ensure model has an id property
    user: User,
    callback: (transaction: Transaction) => Promise<void>,
    isClone: boolean = false,
  ): Promise<void> {
    const eventId = event.id;
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();

      if (isClone) {
        this.coreService.communicate(event.id, 'schedule-event-status', user);
      }
      /*
        Emitting Socket for Success message on creation of all associations for the relative event
      */
      this.pusherService.sendDataUpdates(
        PusherChannels.EVENTS_CHANNEL,
        [PusherEvents.NEW_CREATED_EVENT],
        {
          code: 200,
          event,
        },
      );

      return result;
    } catch (error) {
      /*
        In case of any error while creation of Association it
        will Find Event by id and destroy it
      */
      console.log(error.message);
      if (isClone) {
        const event: Event = await this.event.findOne({
          where: { id: eventId },
        });
        if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);
        await event.destroy();
      }
    } finally {
      /*
        In case of any error while creation of Association it
        will roll back all changes after destruction of event and
        will emit a socket for Failure message
      */
      await transaction.rollback();
      this.pusherService.sendDataUpdates(
        PusherChannels.EVENTS_CHANNEL,
        [PusherEvents.NEW_CREATED_EVENT],
        {
          code: 500,
          event,
        },
      );
    }
  }
}
