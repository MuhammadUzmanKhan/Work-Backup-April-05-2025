import {
  CreateResolvedIncidentNoteDto,
  UpdateResolvedIncidentNoteDto,
} from '../dto';

export const createResolvedIncidentNote = {
  type: CreateResolvedIncidentNoteDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_id: 4288,
        affected_person: 2,
        note: 'This is a testing note.',
        status: 'arrest',
      },
    },
    'With note only': {
      value: {
        event_id: 2015,
        incident_id: 4288,
        note: 'This is a testing note.',
        status: 'eviction_ejection',
      },
    },
    'With affected person only': {
      value: {
        event_id: 2015,
        incident_id: 4288,
        affected_person: 2,
        status: 'hospital_transport',
      },
    },
  },
};

export const updateResolvedIncidentNote = {
  type: UpdateResolvedIncidentNoteDto,
  examples: {
    Example: {
      value: {
        affected_person: 2,
        note: 'This is a testing note.',
        status: 'arrest',
      },
    },
    'With note only': {
      value: {
        note: 'This is a testing note.',
      },
    },
    'With affected person only': {
      value: {
        affected_person: 2,
      },
    },
    'With status only': {
      value: {
        status: 'hospital_transport',
      },
    },
  },
};
