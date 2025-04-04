import {
  DestroyMultipleIncidentTypesDto,
  TypeAssocitateOrDisassociateToEventDto,
  UploadIncidentTypesDto,
} from '../dto';

export const uploadIncidentTypes = {
  type: UploadIncidentTypesDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        file: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/db3e6b1698321218/Sources%20-%20upload_incident_types.csv',
      },
    },
  },
};

export const destroyMultipleIncidentTypes = {
  type: DestroyMultipleIncidentTypesDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_type_ids: [0],
      },
    },
  },
};

export const manageIncidentTypes = {
  type: TypeAssocitateOrDisassociateToEventDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_type_ids: [0, 1],
      },
    },
  },
};
