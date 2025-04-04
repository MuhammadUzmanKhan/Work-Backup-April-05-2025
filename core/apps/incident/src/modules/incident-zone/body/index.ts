import {
  CreateIncidentCameraZoneDto,
  CreateIncidentSubZoneDto,
  CreateIncidentZoneDto,
  UpdateIncidentSubZoneDto,
  UpdateIncidentZoneDto,
  UploadIncidentCameraZoneDto,
  UploadIncidentSubZoneDto,
  UploadIncidentMainZoneDto,
} from '../dto';

export const createIncidentZone = {
  type: CreateIncidentZoneDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        name: 'Incident Zone',
        color: '#a7a1a1',
        longitude: '2.1698166',
        latitude: '41.3856087',
        sequence: 0,
      },
    },
  },
};

export const createIncidentSubZone = {
  type: CreateIncidentSubZoneDto,
  examples: {
    Example: {
      value: {
        parent_id: 3827,
        event_id: 2015,
        name: 'Incident Sub Zone',
        color: '#a7a1a1',
        longitude: '2.1698166',
        latitude: '41.3856087',
        sequence: 0,
      },
    },
  },
};

export const updateIncidentZone = {
  type: UpdateIncidentZoneDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        name: 'Incident Zone',
        color: '#a7a1a1',
        longitude: '2.1698166',
        latitude: '41.3856087',
      },
    },
  },
};

export const updateIncidentSubZone = {
  type: UpdateIncidentSubZoneDto,
  examples: {
    Example: {
      value: {
        parent_id: 3827,
        event_id: 2015,
        name: 'Incident Zone',
        color: '#a7a1a1',
        longitude: '2.1698166',
        latitude: '41.3856087',
      },
    },
  },
};

export const createIncidentCameraZone = {
  type: CreateIncidentCameraZoneDto,
  examples: {
    Example: {
      value: {
        name: 'New Camera Zone 1',
        camera_type: 'digital',
        directions_monitored: 'directions',
        url: 'feed',
        longitude: '2.1698166',
        latitude: '41.3856087',
        device_id: 'jiwe0rsd09ifm',
        event_id: 2292,
      },
    },
  },
};

export const uploadIncidentMainZone = {
  type: UploadIncidentMainZoneDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_main_zones: [
          {
            name: 'Test Incident Zone 1',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
          },
          {
            name: 'Test Incident Zone 2',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/d3d55c1717062030/Untitled%20spreadsheet%20-%20OnTrack%20Incident%20Upload%20Template.csv',
        file_name: 'incident_zones.csv',
      },
    },
  },
};

export const uploadIncidentSubZone = {
  type: UploadIncidentSubZoneDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_sub_zones: [
          {
            name: 'Test Incident Zone 1',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
            parent_id: 3867,
          },
          {
            name: 'Test Incident Zone 2',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
            parent_id: 3867,
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/d3d55c1717062030/Untitled%20spreadsheet%20-%20OnTrack%20Incident%20Upload%20Template.csv',
        file_name: 'incident_zones.csv',
      },
    },
  },
};

export const uploadIncidentCameraZone = {
  type: UploadIncidentCameraZoneDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        camera_zones: [
          {
            name: 'Test Incident Camera Zone 1',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
            camera_type: 'cam',
            device_id: 2,
            directions_monitored: 'lorem ipsum',
          },
          {
            name: 'Test Incident Camera Zone 2',
            longitude: '-73.60812533804311',
            latitude: '-73.60812533804311',
            camera_type: 'cam',
            device_id: 2,
            directions_monitored: 'lorem ipsum',
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/d3d55c1717062030/Untitled%20spreadsheet%20-%20OnTrack%20Incident%20Upload%20Template.csv',
        file_name: 'camera_zones.csv',
      },
    },
  },
};
