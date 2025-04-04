import { Op } from 'sequelize';
import {
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { IncidentTypeTranslation } from '@ontrack-tech-group/common/models';

export const sendUpdatedIncidentTypesVariant = (
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_TYPE_VARIATION_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

export const incidentTypeTranslationById = async (id: number | number[]) => {
  if (typeof id === 'number')
    return await IncidentTypeTranslation.findByPk(id, { useMaster: true });

  return await IncidentTypeTranslation.findAll({
    where: {
      id: {
        [Op.in]: id,
      },
    },
    useMaster: true,
  });
};

export const incidentTranslationChangeLogWhere = (
  sub_company_ids: number[] | number,
  incident_type_ids: number[] | number,
) => {
  if (typeof sub_company_ids == 'number') sub_company_ids = [sub_company_ids];

  if (typeof incident_type_ids == 'number')
    incident_type_ids = [incident_type_ids];

  let _where = {};

  if (sub_company_ids.length) {
    if (!_where[Op.or]) _where = { [Op.or]: [] };

    sub_company_ids.map((sub_company_id) => {
      _where[Op.or].push({
        additional_values: {
          sub_company_id,
        },
      });
    });
  }

  if (incident_type_ids.length) {
    if (!_where[Op.or]) _where = { [Op.or]: [] };

    incident_type_ids.map((incident_type_id) => {
      _where[Op.or].push({
        additional_values: {
          core_incident_type_id: incident_type_id,
        },
      });
    });
  }

  return _where;
};
