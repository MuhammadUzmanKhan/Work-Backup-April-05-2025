import { FindOptions, Model, Op, Sequelize, Transaction } from 'sequelize';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Alert,
  Company,
  ContactDirectory,
  Event,
  EventContact,
  Image,
  IncidentMessageCenter,
  MobileIncidentInbox,
  PresetMessage,
  PriorityGuide,
  User,
} from '@ontrack-tech-group/common/models';
import { AlertableType, RESPONSES } from '@ontrack-tech-group/common/constants';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { ERRORS, SortBy } from '@ontrack-tech-group/common/constants';
import { ClonerHelper } from '@Common/helpers/index';
import { CloneDto } from '@Modules/clone/dto';

export const clonePolymorphicAssociation = async <T extends Model>(
  model: { new (): T } & typeof Model,
  oldId: number,
  newId: number,
  modelToBeCloned: string,
  eventId: number,
  lookupColumn: string,
  transaction: Transaction,
): Promise<void> => {
  const entities: Model[] = await model.findAll({
    where: {
      [`${lookupColumn}_id`]: oldId,
      [`${lookupColumn}_type`]: modelToBeCloned,
    },
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  } as FindOptions);

  for (const entity of entities) {
    const clonedObject = entity.get({ plain: true });
    delete clonedObject.id;
    clonedObject[`${lookupColumn}_id`] = newId;
    clonedObject.event_id = eventId;

    await model.findOrCreate({ where: clonedObject, transaction });
  }
};

export const cloneAssociation = async <T extends Model>(
  model: { new (): T } & typeof Model,
  eventId: number,
  newEventId: number,
  transaction: Transaction,
  clonePolyMorphicModels?: (typeof Image)[],
  callback?: (data: Map<number, number>) => void,
): Promise<number> => {
  const entities: Model[] = await model.findAll({
    where: { event_id: eventId },
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [['created_at', SortBy.ASC]],
  } as FindOptions);
  const oldIdToIdMap: Map<number, number> = new Map<number, number>();

  for (const entity of entities) {
    const clonedObject = entity.get({ plain: true });

    const oldId: number = clonedObject.id;
    delete clonedObject.id;
    clonedObject.event_id = newEventId;

    const [newInstance] = await model.findOrCreate({
      where: clonedObject,
      transaction,
    });
    oldIdToIdMap.set(oldId, newInstance['id']);

    if (clonePolyMorphicModels?.length) {
      for (const polymorphicModel of clonePolyMorphicModels) {
        await clonePolymorphicAssociation(
          polymorphicModel,
          oldId,
          newInstance['id'],
          model.name,
          newEventId,
          `${polymorphicModel.name.toLowerCase()}able`,
          transaction,
        );
      }
    }
  }

  if (callback) callback(oldIdToIdMap);

  return entities.length;
};

export const clonePriorityGuide = async (
  eventId: number,
  newEventId: number,
  transaction: Transaction,
  clonePolyMorphicModels?: (typeof Image)[],
  priorityGuideDelete?: boolean,
): Promise<void> => {
  // Initialize a Map to store the cloned priority guides
  let clonedPriorityGuides: Map<number, number> = new Map<number, number>();

  if (priorityGuideDelete)
    // Deleting Priority Guides that are created using afterCreate hook
    await PriorityGuide.destroy({
      where: { event_id: newEventId },
      transaction,
    });

  // Clone associations and update the clonedPriorityGuides Map
  await ClonerHelper.cloneAssociation(
    PriorityGuide,
    eventId,
    newEventId,
    transaction,
    clonePolyMorphicModels,
    async (response) => {
      // Alerts for Incident Types only
      clonedPriorityGuides = response;
    },
  );

  // Find all IncidentType alerts for the given event
  const incidentTypeAlerts: Model[] = await Alert.findAll({
    where: {
      alertable_type: 'IncidentType',
      event_id: eventId,
    },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
  } as FindOptions);

  // Prepare IncidentType alerts for bulk creation with the new event ID
  const plainIncidentTypeAlerts = incidentTypeAlerts.map(
    (incidentTypeAlert: Model) => ({
      ...incidentTypeAlert.dataValues,
      event_id: newEventId,
    }),
  );

  await Alert.bulkCreate(plainIncidentTypeAlerts, {
    transaction,
  });

  let priorityGuideAlertsJSON = [];
  // Clone alerts associated with priority guides
  for (const [key, value] of clonedPriorityGuides) {
    const priorityGuideAlerts: Model[] = await Alert.findAll({
      where: {
        alertable_type: 'PriorityGuide',
        event_id: eventId,
        alertable_id: key,
      },
      attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    } as FindOptions);

    // Convert to JSON object
    priorityGuideAlertsJSON = [
      ...priorityGuideAlerts.map((alert: Model) => ({
        ...alert.toJSON(),
        alertable_id: value,
        event_id: newEventId,
      })),
      ...priorityGuideAlertsJSON,
    ];
  }

  await Alert.bulkCreate(priorityGuideAlertsJSON, {
    transaction,
  });
};

export const getEventById = async (id: number) => {
  const event: Event = await Event.findOne({
    where: { id },
    attributes: {
      exclude: [
        'createdAt',
        'updatedAt',
        'public_start_date',
        'public_end_date',
        'start_date',
        'end_date',
        'status',
      ],
      include: [[Sequelize.col(`"company"."name"`), 'company_name']],
    },
    include: [
      {
        model: Company,
        attributes: [],
      },
    ],
  });
  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  return event;
};

export const fetchPriorities = async (eventId: number) => {
  return await PriorityGuide.findAll({
    where: {
      event_id: eventId,
    },
    attributes: {
      exclude: ['createdAt', 'deletedAt', 'updatedAt'],
    },
  });
};

export const combineIds = (
  source: { [p: string]: number | string },
  current: { [p: string]: number | string },
): { [p: string]: string } => {
  const indexes: number[] = [0, 1, 2, 3];

  const indexesData = indexes.map((idx: number) => ({
    [Object.keys(source).find((key: string) => source[key] === idx)]:
      Object.keys(current).find((key: string) => current[key] === idx),
  }));

  const keyValueMapping = {};

  indexesData.forEach((indexeData) => {
    const key = Object.keys(indexeData)[0];
    keyValueMapping[key] = indexeData[key];
  });

  return keyValueMapping;
};

export const cloneAlerts = async ({
  eventId,
  sourceEventId,
  alertableType,
  transaction,
}: {
  eventId: number;
  sourceEventId: number;
  alertableType: AlertableType;
  transaction: Transaction;
}) => {
  // Define condition and ID mapping objects
  let condition = {};
  const currentIds: { [key: string]: number | string } = {};
  const sourceIds: { [key: string]: number | string } = {};
  let combinedIds = {};

  if (alertableType === 'PriorityGuide') {
    // Fetch source priority guides
    const sourcePriorityGuides = await fetchPriorities(sourceEventId);
    if (!sourcePriorityGuides.length) {
      throw new Error('No priority guide to clone!');
    }

    // Map source priority guide IDs
    sourcePriorityGuides.forEach((priorityGuide) => {
      sourceIds[priorityGuide.id] = priorityGuide.priority;
    });

    // Fetch current priority guides
    let currentPriorityGuides = await fetchPriorities(eventId);
    if (!currentPriorityGuides.length) {
      const newPriorityGuides = sourcePriorityGuides.map((data) => ({
        ...data.dataValues,
        event_id: eventId,
      }));
      newPriorityGuides.forEach((guide) => delete guide.id);

      await PriorityGuide.bulkCreate(newPriorityGuides, { transaction });
      currentPriorityGuides = await fetchPriorities(eventId);
    }

    // Map current priority guide IDs
    currentPriorityGuides.forEach((priorityGuide) => {
      currentIds[priorityGuide.id] = priorityGuide.priority;
    });

    // Set condition for fetching alerts
    condition = {
      alertable_type: alertableType,
      alertable_id: {
        [Op.in]: sourcePriorityGuides.map((guide) => guide.dataValues.id),
      },
    };
  } else {
    condition = {
      alertable_type: alertableType,
      event_id: sourceEventId,
    };
  }

  // Fetch alerts based on condition
  const alerts = await Alert.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
  });

  if (!alerts) {
    throw new BadRequestException(RESPONSES.notFound('Alerts'));
  }

  // Combine source and current IDs
  if (alertableType === 'PriorityGuide')
    combinedIds = combineIds(sourceIds, currentIds);

  // Map existing alerts for creation or updating
  const existingAlerts = alerts.map((data) => {
    const newId = combinedIds && combinedIds[data.alertable_id];
    if (!newId && alertableType === 'PriorityGuide') return;
    const _data_ = {
      ...data.dataValues,
      event_id: eventId,
    };
    if (alertableType === 'PriorityGuide') {
      _data_.alertable_id = newId;
    }
    return _data_;
  });

  // Create or update alerts
  for (const existingAlert of existingAlerts) {
    await Alert.findOrCreate({
      where: { ...existingAlert, event_id: eventId },
      transaction,
    });
  }

  return { message: 'Alerts Cloned Successfully' };
};

export const cloneSelfAssociation = async <T extends Model>(
  model: { new (): T } & typeof Model,
  eventId: number,
  newEventId: number,
  transaction: Transaction,
): Promise<number> => {
  const entities: Model[] = await model.findAll({
    where: { event_id: eventId },
    attributes: { include: ['*'] },
  } as FindOptions);

  const oldIdToIdMap: Map<number, number> = new Map<number, number>();
  const dataSet: Model[] = [];

  for (const entity of entities) {
    const clonedObject = entity.get({ plain: true });
    const oldId = clonedObject.id;
    delete clonedObject.id;
    clonedObject.event_id = newEventId;

    const [response] = await model.findOrCreate({
      where: clonedObject,
      transaction,
    });
    oldIdToIdMap.set(oldId, response['id']);
    dataSet.push(response);
  }

  await Promise.all(
    dataSet.map(async (row) => {
      if (row['parent_id']) {
        row['parent_id'] =
          oldIdToIdMap.get(row['parent_id']?.toString()) || null;
        await row.save({ transaction });
      }
    }),
  );

  return entities.length;
};

export const checkEventOfSameCompany = async (
  user: User,
  current_event_id: number,
  clone_event_id: number,
) => {
  const [cloneCompanyId] = await withCompanyScope(user, clone_event_id);
  const [currentCompanyId] = await withCompanyScope(user, current_event_id);

  if (currentCompanyId !== cloneCompanyId)
    throw new UnprocessableEntityException(
      'Cloned Event And Current Events are not from same Company',
    );

  return true;
};

export const cloneData = async (
  eventId: number,
  sourceId: number,
  transaction: Transaction,
): Promise<Record<number, number>> => {
  const idMapping: Record<number, number> = {};

  const sourceEventContacts = await EventContact.findAll({
    where: {
      event_id: sourceId,
    },
    attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
  });

  const sourceEventContactValues = sourceEventContacts.map(
    (sourceEventContact) => sourceEventContact.dataValues,
  );

  for (const sourceEventContactValue of sourceEventContactValues) {
    const id = sourceEventContactValue.id;
    delete sourceEventContactValue.id;

    const existingRecord = await EventContact.findOne({
      where: { ...sourceEventContactValue, event_id: eventId },
    });

    if (!existingRecord) {
      const [newRecord] = await EventContact.findOrCreate({
        where: sourceEventContactValue,
        transaction,
      });

      ContactDirectory.findOrCreate({
        where: {
          event_contact_id: newRecord.id,
          event_id: eventId,
        },
        transaction,
      });

      idMapping[id] = newRecord.id;
    } else {
      idMapping[id] = existingRecord.id;
    }
  }

  return idMapping;
};

export const cloneIncidentMessagingCenterHelper = async (
  user: User,
  clone_alert: CloneDto,
) => {
  const { clone_event_id, current_event_id } = clone_alert;
  let createdCount = 0;

  await withCompanyScope(user, current_event_id);

  const incidentMessages = await IncidentMessageCenter.findAll({
    where: { event_id: clone_event_id },
  });

  const mappedMessages = incidentMessages.map((data) => ({
    name: data.name,
    phone_number: data.phone_number,
    country_code: data.country_code,
    country_iso_code: data.country_iso_code,
  }));

  for (const mappedMessage of mappedMessages) {
    const { name, phone_number, country_code, country_iso_code } =
      mappedMessage;

    const [created] = await IncidentMessageCenter.findOrCreate({
      where: {
        phone_number,
        event_id: current_event_id,
        country_code,
      },
      defaults: {
        name,
        country_iso_code,
      },
    });

    if (created) {
      createdCount++;
    }
  }

  if (!createdCount) return { message: 'No Records Clone From Passed Event' };

  return {
    message: 'Event Incident Messages Cloned Successfully',
    createdCount,
  };
};

export const clonePresetMessagingHelper = async (
  user: User,
  clone_alert: CloneDto,
) => {
  const { clone_event_id, current_event_id } = clone_alert;

  let createdCount = 0;

  await withCompanyScope(user, current_event_id);

  const presetMessages = await PresetMessage.findAll({
    where: { event_id: clone_event_id },
  });

  const mappedPresetMessages = presetMessages.map((data) => ({
    title: data.title,
    text: data.text,
    hot_key: data.hot_key,
    is_enabled: data.is_enabled,
  }));

  for (const mappedPresetMessage of mappedPresetMessages) {
    const { title, hot_key, text, is_enabled } = mappedPresetMessage;
    mappedPresetMessage;

    const [created] = await PresetMessage.findOrCreate({
      where: {
        hot_key,
        event_id: current_event_id,
      },
      defaults: {
        title,
        text,
        is_enabled,
      },
    });

    if (created) {
      createdCount++;
    }
  }

  if (!createdCount) return { message: 'No Records Clone From Passed Event' };

  return { message: 'Event Preset Messages Cloned Successfully', createdCount };
};

export const cloneMobileIncidentInboxesHelper = async (
  user: User,
  clone_alert: CloneDto,
) => {
  const { clone_event_id, current_event_id } = clone_alert;

  let createdCount = 0;

  await withCompanyScope(user, current_event_id);

  const mobileIncidentInboxes = await MobileIncidentInbox.findAll({
    where: { event_id: clone_event_id },
  });

  const mappedMobileIncidentInboxes = mobileIncidentInboxes.map((data) => ({
    name: data.name,
    visible_status: data.visible_status,
    phone_number: data.phone_number,
    country_code: data.country_code,
    country_iso_code: data.country_iso_code,
  }));

  for (const mappedMobileIncidentInbox of mappedMobileIncidentInboxes) {
    const {
      name,
      visible_status,
      phone_number,
      country_code,
      country_iso_code,
    } = mappedMobileIncidentInbox;

    const [created] = await MobileIncidentInbox.findOrCreate({
      where: {
        name,
        visible_status,
        phone_number,
        country_code,
        country_iso_code,
        event_id: current_event_id,
      },
    });

    if (created) {
      createdCount++;
    }
  }

  if (!createdCount) return { message: 'No Records Clone From Passed Event' };

  return { message: 'Mobile Incident Inbox Cloned Successfully', createdCount };
};

export default {
  cloneAssociation,
  clonePolymorphicAssociation,
  checkEventOfSameCompany,
  clonePriorityGuide,
  getEventById,
  cloneAlerts,
  cloneSelfAssociation,
  cloneData,
  cloneIncidentMessagingCenterHelper,
};
