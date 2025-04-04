export * from './responses';
export * from './enums';
export * from './interfaces';

export const incidentStatusMap = {
  0: 'Open',
  1: 'Dispatched',
  7: 'Responding',
  6: 'On Scene',
  5: 'Transport',
  3: 'Arrival',
  4: 'Follow Up',
  2: 'Resolved',
};

export const priorityMap = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Critical',
};

export const resolvedIncidentNoteStatusDbMap = {
  0: 'Arrest',
  1: 'Eviction/Ejection',
  2: 'Hospital Transport',
  3: 'Treated and Released',
  4: 'Resolved',
};

export const incidentStatusMapNumberToString = {
  0: 'open',
  1: 'dispatched',
  7: 'responding',
  6: 'at_scene',
  5: 'in_route',
  3: 'archived',
  4: 'follow_up',
  2: 'resolved',
};

export const priorityMapNumberToString = {
  0: 'low',
  1: 'medium',
  2: 'high',
  3: 'critical',
};

export const resolvedStatusMapNumberToString = {
  0: 'arrest',
  1: 'eviction_ejection',
  2: 'hospital_transport',
  3: 'treated_and_released',
  4: 'resolved_note',
};
