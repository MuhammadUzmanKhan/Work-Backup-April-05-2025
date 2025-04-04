import { Sequelize, Model, Transaction } from 'sequelize';
import { Image, IncidentZone, User } from '@ontrack-tech-group/common/models';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';
import { IncidentService } from '@ontrack-tech-group/common/services';
import { ClonerHelper } from '@Common/helpers';
import { CloneAlertsDto, CloneDto } from '@Modules/clone/dto';
import { checkEventOfSameCompany } from '@Common/helpers/cloningMethods';

export const cloneData = async <T extends Model>(
  clone_alert: CloneDto,
  user: User,
  model: { new (): T } & typeof Model,
  transaction: Transaction,
  selfAssociation: boolean = false,
  polyMorphicAssociation: boolean = false,
) => {
  await checkEventOfSameCompany(
    user,
    clone_alert.clone_event_id,
    clone_alert.current_event_id,
  );

  const currentEvent = await ClonerHelper.getEventById(
    clone_alert.current_event_id,
  );

  const sourceEvent = await ClonerHelper.getEventById(
    clone_alert.clone_event_id,
  );

  if (selfAssociation) {
    return await ClonerHelper.cloneSelfAssociation(
      model,
      sourceEvent.id,
      currentEvent.id,
      transaction,
    );
  } else {
    return await ClonerHelper.cloneAssociation(
      model,
      sourceEvent.id,
      currentEvent.id,
      transaction,
      polyMorphicAssociation && [Image],
    );
  }
};

export const withGenericTransaction = async <T extends Model>(
  clone_alert: CloneDto,
  user: User,
  model: { new (): T } & typeof Model,
  sequelize: Sequelize,
  selfAssociation: boolean = false,
  polyMorphicAssociation: boolean = false,
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const counts = await cloneData(
      clone_alert,
      user,
      model,
      transaction,
      selfAssociation,
      polyMorphicAssociation,
    );

    await transaction.commit();
    return { message: 'Successfully are cloned!', counts };
  } catch (e) {
    await transaction.rollback();
    throwCatchError(e);
  }
};

export const cloneSubZonesWo = async (
  clone_alert: CloneDto,
  user: User,
  transaction: Transaction,
) => {
  await checkEventOfSameCompany(
    user,
    clone_alert.clone_event_id,
    clone_alert.current_event_id,
  );

  // Fetch current and source events by their IDs
  const currentEvent = await ClonerHelper.getEventById(
    clone_alert.current_event_id,
  );
  const sourceEvent = await ClonerHelper.getEventById(
    clone_alert.clone_event_id,
  );

  // Fetch all incident zones for the source event
  const incidentZones = await IncidentZone.findAll({
    where: { event_id: sourceEvent.id },
  });

  const incidentZonesDataValues = incidentZones.map(
    (incidentZone: IncidentZone) => incidentZone.dataValues,
  );

  // Extract IDs of incident zones to find valid sub zones
  const incidentZoneIds = incidentZonesDataValues.map(
    (incidentZonesDataValue) => Number(incidentZonesDataValue.id),
  );

  // Filter sub zones based on parent IDs
  const subZones = incidentZonesDataValues.filter((incidentZone) =>
    incidentZoneIds.includes(incidentZone.parent_id),
  );

  // Filter parent zones that have sub zones
  const filteredIncidentParentZones = incidentZonesDataValues.filter(
    (incidentZone) =>
      subZones.some((subZone) => subZone.parent_id === Number(incidentZone.id)),
  );

  // Clone incident zones and their sub zones
  for (const incidentZone of filteredIncidentParentZones) {
    const { name, latitude, longitude, color, sequence, id } = incidentZone;
    const [parentZone] = await IncidentZone.findOrCreate({
      where: {
        name,
        latitude,
        longitude,
        color,
        sequence,
        event_id: clone_alert.current_event_id,
      },
      transaction,
    });

    const subZonesForParent = subZones.filter(
      (subZone) => subZone.parent_id == id,
    );

    for (const subZone of subZonesForParent) {
      const { name, latitude, longitude, color } = subZone;
      await IncidentZone.findOrCreate({
        where: {
          name,
          latitude,
          longitude,
          color,
          event_id: currentEvent.id,
          parent_id: parentZone.id,
        },
        transaction,
      });
    }
  }

  return subZones.length;
};

export const cloneSubZones = async (
  clone_alert: CloneDto,
  user: User,
  sequelize: Sequelize,
) => {
  const transaction: Transaction = await sequelize.transaction();
  try {
    const counts = await cloneSubZonesWo(clone_alert, user, transaction);

    await transaction.commit();
    return { message: 'Successfully cloned!', counts };
  } catch (e) {
    await transaction.rollback();
    throwCatchError(e);
  }
};

export const cloneAlerts = async (
  user: User,
  clone_alert: CloneAlertsDto,
  incidentService: IncidentService,
  transaction: Transaction,
) => {
  const { alertable_type, clone_event_id, current_event_id } = clone_alert;

  await checkEventOfSameCompany(user, clone_event_id, current_event_id);

  const currentEvent = await ClonerHelper.getEventById(current_event_id);

  const sourceEvent = await ClonerHelper.getEventById(clone_event_id);

  await ClonerHelper.cloneAlerts({
    eventId: currentEvent.id,
    sourceEventId: sourceEvent.id,
    alertableType: alertable_type,
    transaction,
  });

  const allIncidentTypeAndPriorityGuideCount =
    await incidentService.communicate(
      currentEvent.id,
      'get-incident-alert-counts',
      user,
    );

  return {
    message: 'Alerts Cloned Successfully',
    incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
    status: 'clone',
    type: 'alert',
    newEntry: true,
  };
};
