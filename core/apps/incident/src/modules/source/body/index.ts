import {
  UploadSourcesForEventDto,
  DestroyMultipleSourcesDto,
  AssignOrRemoveToEventDto,
} from '../dto';

export const uploadSourcesForEvent = {
  type: UploadSourcesForEventDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        file: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/db3e6b1698321218/Sources%20-%20upload_incident_types.csv',
      },
    },
  },
};

export const destroyMultipleSources = {
  type: DestroyMultipleSourcesDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        source_ids: [0],
      },
    },
  },
};

export const manageSourceTypes = {
  type: AssignOrRemoveToEventDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        source_ids: [0, 1],
      },
    },
  },
};
