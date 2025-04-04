import { NotFoundException } from '@nestjs/common';
import moment from 'moment-timezone';
import * as json2csv from 'json-2-csv';
import { Op } from 'sequelize';
import {
  IncidentStatusType,
  MODULE_NAMES,
  Priority,
  ResolvedIncidentNoteStatusDb,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import {
  checkIfAllIdsExistWithObject,
  humanizeTitleCase,
} from '@ontrack-tech-group/common/helpers';
import {
  Company,
  Event,
  Incident,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  Preset,
} from '@ontrack-tech-group/common/models';
import {
  incidentStatusMapNumberToString,
  priorityMapNumberToString,
  resolvedStatusMapNumberToString,
} from '@Common/constants';
import { GetAllPresetDto, PresetFiltersDto } from '../dto';

export const checkValidations = async (filters: PresetFiltersDto) => {
  const { incident_division_ids, incident_type_ids, incident_zone_ids } =
    filters;
  let incidentDivisions = [];
  let incidentTypes = [];
  let incidentZones = [];

  if (incident_division_ids?.length) {
    incidentDivisions = await checkIfAllIdsExistWithObject(
      IncidentDivision,
      'Some Of Incident Divisions',
      incident_division_ids,
    );
  }

  if (incident_type_ids?.length) {
    incidentTypes = await checkIfAllIdsExistWithObject(
      IncidentType,
      'Some Of Incident Types',
      incident_type_ids,
    );
  }

  if (incident_zone_ids?.length) {
    incidentZones = await checkIfAllIdsExistWithObject(
      IncidentZone,
      'Some Of Incident Zones',
      incident_zone_ids,
    );
  }

  return { incidentDivisions, incidentTypes, incidentZones };
};

export const mapFiltersForDb = (
  filters: PresetFiltersDto,
  incidentDivisions: IncidentDivision[],
  incidentTypes: IncidentType[],
  incidentZones: IncidentZone[],
) => {
  const {
    incident_division_ids,
    incident_type_ids,
    incident_zone_ids,
    status,
    dispatched_status,
    ...rest
  } = filters;

  return {
    ...rest,
    incident_divisions: includeIfNotEmpty(incidentDivisions),
    incident_types: includeIfNotEmpty(incidentTypes),
    incident_zones: includeIfNotEmpty(incidentZones),
    status: status?.map((status) => IncidentStatusType[status.toUpperCase()]),
    dispatched_status: dispatched_status?.map(
      (status) => IncidentStatusType[status.toUpperCase()],
    ),
    priority: filters.priority?.map(
      (priority) => Priority[priority.toUpperCase()],
    ),
    resolution_status: filters.resolution_status?.map(
      (resolution_status) =>
        ResolvedIncidentNoteStatusDb[resolution_status.toUpperCase()],
    ),
  };
};

export const mapFiltersForResponse = (preset: Preset) => {
  const {
    date,
    incident_divisions,
    incident_types,
    incident_zones,
    status,
    priority,
    dispatched_status,
    resolution_status,
  } = preset.filters || {};
  return {
    ...preset.toJSON(),
    filters: {
      date,
      incidentDivisions: incident_divisions,
      incidentTypes: incident_types,
      incidentZones: incident_zones,
      status: status?.map(
        (status: number) => incidentStatusMapNumberToString[status],
      ),
      dispatched_status: dispatched_status?.map(
        (status: number) => incidentStatusMapNumberToString[status],
      ),
      priority: priority?.map(
        (priority: number) => priorityMapNumberToString[priority],
      ),
      resolution_status: resolution_status?.map(
        (resolutionStatus: number) =>
          resolvedStatusMapNumberToString[resolutionStatus],
      ),
    },
  };
};

export const isPresetExist = async (id: number) => {
  const preset = await Preset.findByPk(id, {
    attributes: { exclude: ['updatedAt'] },
    include: [
      {
        model: Event,
        attributes: ['name'],
        include: [{ model: Company, attributes: ['name'] }],
      },
    ],
  });

  if (!preset) throw new NotFoundException(RESPONSES.notFound('Preset'));

  return preset;
};

export const includeIfNotEmpty = <T>(arr: T[]): T[] | undefined =>
  arr.length ? arr : undefined;

export const mapFiltersForQueryParams = (preset: Preset) => {
  const {
    date,
    incident_divisions,
    incident_types,
    incident_zones,
    status,
    dispatched_status,
    priority,
    resolution_status,
  } = preset.filters || {};
  return {
    reporting: true, // It is additional param for incident APIs as there is a check based on this in where condition of incident csv
    event_id: preset.event_id,
    start_date: date?.start_date,
    end_date: date?.end_date,
    incident_division_ids: incident_divisions?.map(
      (division: IncidentDivision) => +division.id,
    ),
    incident_type_id: incident_types?.map((type: IncidentType) => type.id),
    incident_zone_id: incident_zones?.map((zone: IncidentZone) => +zone.id),
    status: status?.map(
      (status: number) => incidentStatusMapNumberToString[status],
    ),
    dispatched_status: dispatched_status?.map(
      (status: number) => incidentStatusMapNumberToString[status],
    ),
    priorities: priority?.map(
      (priority: number) => priorityMapNumberToString[priority],
    ),
    resolved_status: resolution_status?.map(
      (resolutionStatus: number) =>
        resolvedStatusMapNumberToString[resolutionStatus],
    ),
  };
};

export const formatAndGenerateCsv = async (
  incidents: Incident[],
  timezone: string,
) => {
  const csvData = incidents.map((incident) => {
    const {
      id,
      logged_date_time,
      status,
      priority,
      incident_types,
      description,
      incident_divisions,
      users,
      incident_zone,
    } = incident;

    return {
      ID: id,
      Time: moment(logged_date_time || incident['created_at'])
        .tz(timezone)
        .format('YYYY-MM-DD - hh:mm A'),
      Division: incident_divisions?.length
        ? incident_divisions.map((division) => division.name).join(', ')
        : 'N/A',
      Type: incident_types.name,
      Priority: humanizeTitleCase(priority as unknown as string),
      Description: description,
      Status: humanizeTitleCase(status as unknown as string),
      Dispatched: users?.length
        ? users.map((user) => user.name).join(', ')
        : '--',
      Location: incident_zone?.name || 'Field Location Logged',
    };
  });

  const csvString = await json2csv.json2csv(csvData);

  return csvString;
};

export const getAllPresetWhere = (
  getAllPresetDto: GetAllPresetDto,
  user_id: number,
) => {
  const where = {};

  const { event_id, keyword } = getAllPresetDto;
  where['user_id'] = user_id;

  where['event_id'] = event_id;

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  where['module'] = MODULE_NAMES.REPORTING;

  return where;
};
