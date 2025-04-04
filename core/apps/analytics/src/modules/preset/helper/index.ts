import { checkIfAllIdsExistWithObject } from '@ontrack-tech-group/common/helpers';
import {
  Company,
  IncidentDivision,
  IncidentType,
  Region,
  Event,
} from '@ontrack-tech-group/common/models';
import { FilterDto } from '../dto';

export const checkValidations = async (filters: FilterDto) => {
  const { incident_division_ids, incident_type_ids } = filters.incident_filters;
  const { event_regions_ids, company_ids, event_ids } = filters.event_filters;

  let incidentDivisions = [];
  let incidentTypes = [];
  let eventRegions = [];
  let companies = [];
  let events = [];

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

  if (event_regions_ids?.length) {
    eventRegions = await checkIfAllIdsExistWithObject(
      Region,
      'Some Of Event Regions',
      event_regions_ids,
    );
  }

  if (company_ids?.length) {
    companies = await checkIfAllIdsExistWithObject(
      Company,
      'Some Of Companies',
      company_ids,
    );
  }

  if (event_ids?.length) {
    events = await checkIfAllIdsExistWithObject(
      Event,
      'Some Of Events',
      event_ids,
    );
  }

  return { incidentDivisions, incidentTypes, eventRegions, companies, events };
};

export const mapFiltersForDb = (
  filters: FilterDto,
  incidentDivisions: IncidentDivision[],
  incidentTypes: IncidentType[],
  eventRegions: Region[],
  companies: Company[],
  events: Event[],
) => {
  const { incident_division_ids, incident_type_ids, ...rest_incident_filters } =
    filters.incident_filters;

  const { event_regions_ids, ...rest_event_filters } = filters.event_filters;

  return {
    ...rest_incident_filters,
    ...rest_event_filters,
    incident_divisions: includeIfNotEmpty(incidentDivisions),
    incident_types: includeIfNotEmpty(incidentTypes),
    event_regions: includeIfNotEmpty(eventRegions),
    companies: includeIfNotEmpty(companies),
    events: includeIfNotEmpty(events),
    date_range: `${filters.date.start_date} - ${filters.date.end_date}`,
  };
};

export const includeIfNotEmpty = <T>(arr: T[]): T[] | undefined =>
  arr.length ? arr : undefined;
