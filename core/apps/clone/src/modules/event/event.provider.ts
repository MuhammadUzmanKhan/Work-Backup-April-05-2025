// event.provider.ts
import { Transaction } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { Event, User } from '@ontrack-tech-group/common/models';
import { TransactionProvider } from '@Common/providers/transaction';
import {
  eventAssociationHandler,
  eventDisAssociationHandler,
  updateEventCloneFlag,
} from '@Modules/event/helper';

@Injectable()
export class EventProvider {
  constructor(private readonly transactionProvider: TransactionProvider) {}

  async eventAssociations(id: number, newEvent: Event, user: User) {
    return this.transactionProvider.withTransaction(
      newEvent,
      user,
      async (transaction: Transaction) => {
        // Cloning Event Associations
        await eventAssociationHandler(id, newEvent, transaction, true);
        // Updating Event Cloning Flag to True
        await updateEventCloneFlag(newEvent.id);
      },
      true,
    );
  }

  async eventDisAssociation(id: number, event: Event, user: User) {
    return this.transactionProvider.withTransaction(
      event,
      user,
      async (transaction: Transaction) => {
        // Cloning Event Associations
        await eventDisAssociationHandler(event.id, transaction);

        // Cloning Event Associations
        await eventAssociationHandler(id, event, transaction, false);

        // cloning division restriction, dialer layout, pass event access data
        // Updating Importing flag to True
        return await updateEventCloneFlag(event.id, true, true, true, id);
      },
      false,
    );
  }
}
