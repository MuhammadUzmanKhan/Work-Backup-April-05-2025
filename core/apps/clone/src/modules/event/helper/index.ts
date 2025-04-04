import { Transaction, Model, Op } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import {
  Alert,
  Cad,
  CameraZone,
  ContactDirectory,
  Event,
  EventCad,
  EventDepartment,
  EventIncidentDivision,
  EventIncidentType,
  EventSource,
  EventUser,
  Image,
  IncidentMessageCenter,
  IncidentZone,
  MobileIncidentInbox,
  PresetMessage,
  PriorityGuide,
  ReferenceMap,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { ClonerHelper } from '@Common/helpers';
import { getEventById } from '@Common/helpers/cloningMethods';

async function eventAssociationHandler(
  id: number,
  newEvent: Event,
  transaction: Transaction,
  priotiyGuideDelete: boolean,
): Promise<void> {
  const newEventId = newEvent.id;
  const { cloneAssociation, clonePriorityGuide, cloneSelfAssociation } =
    ClonerHelper;

  await Promise.all([
    cloneAssociation(EventUser, id, newEventId, transaction),
    cloneAssociation(EventDepartment, id, newEventId, transaction),
    cloneAssociation(EventIncidentDivision, id, newEventId, transaction),
    cloneAssociation(UserIncidentDivision, id, newEventId, transaction),
    cloneAssociation(EventIncidentType, id, newEventId, transaction),
    cloneSelfAssociation(IncidentZone, id, newEventId, transaction),
    cloneAssociation(CameraZone, id, newEventId, transaction),
    clonePriorityGuide(id, newEventId, transaction, null, priotiyGuideDelete),
    cloneAssociation(ContactDirectory, id, newEventId, transaction),
    cloneAssociation(EventSource, id, newEventId, transaction),
    cloneAssociation(EventCad, id, newEventId, transaction, [Image]),
    cloneAssociation(Cad, id, newEventId, transaction, [Image]),
    cloneAssociation(PresetMessage, id, newEventId, transaction),
    cloneAssociation(IncidentMessageCenter, id, newEventId, transaction),
    cloneAssociation(ReferenceMap, id, newEventId, transaction, [Image]),
    cloneAssociation(MobileIncidentInbox, id, newEventId, transaction),
  ])
    .then(() => {
      console.log('Associations are cloned!');
    })
    .catch((error) => {
      console.log('🚀 BUG ~ error:', error);
      throw new Error(error.message);
    });
}

async function eventDisAssociationHandler(
  eventId: number,
  transaction: Transaction,
): Promise<void> {
  await disassociateAssociation(EventSource, 'event_id', eventId, transaction);
  await disassociateAssociation(EventUser, 'event_id', eventId, transaction);
  await disassociateAssociation(
    EventDepartment,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(IncidentZone, 'event_id', eventId, transaction);

  await disassociateAssociation(
    EventIncidentDivision,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(
    UserIncidentDivision,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(
    EventIncidentType,
    'event_id',
    eventId,
    transaction,
  );

  await disassociateAssociation(CameraZone, 'event_id', eventId, transaction);
  await disassociateAssociation(
    PriorityGuide,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(
    ContactDirectory,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(EventCad, 'event_id', eventId, transaction);
  await disassociateAssociation(Cad, 'event_id', eventId, transaction);

  await disassociateAssociation(Alert, 'event_id', eventId, transaction);

  await disassociateAssociation(
    PresetMessage,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(
    IncidentMessageCenter,
    'event_id',
    eventId,
    transaction,
  );
  await disassociateAssociation(ReferenceMap, 'event_id', eventId, transaction);
  await disassociateAssociation(
    MobileIncidentInbox,
    'event_id',
    eventId,
    transaction,
  );
}

async function disassociateAssociation<T extends Model>(
  model: { new (): T } & typeof Model,
  keyAttribute: string,
  id: number,
  transaction: Transaction,
): Promise<void> {
  await model.destroy({
    where: { [keyAttribute]: id },
    transaction,
  });
}

async function findCommonEventNames(eventName: string) {
  return Event.findAll({
    where: {
      name: {
        [Op.like]: `%${eventName}%`,
      },
    },
    attributes: ['name'],
  }).then((events: Event[]) => events.map((event: Event) => event.name));
}

async function updateEventCloneFlag(
  id: number,
  cloned: boolean = true,
  importValue: boolean = true,
  importEventSettings: boolean = false,
  importFromEventId?: number,
) {
  const event = await Event.findOne({
    where: { id },
    attributes: ['id'],
  });

  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  const updateEvent: any = { cloned, import: importValue };

  // fetching data from source event and updating event basic setting in new event
  if (importEventSettings && importFromEventId) {
    const { division_lock_service, event_access_lock, dialer_layout } =
      await getEventById(importFromEventId);

    Object.assign(updateEvent, {
      event_access_lock,
      division_lock_service,
      dialer_layout,
    });
  }

  await event.update(updateEvent);
}

export {
  eventAssociationHandler,
  eventDisAssociationHandler,
  updateEventCloneFlag,
  findCommonEventNames,
};
