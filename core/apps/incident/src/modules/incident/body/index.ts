import {
  CreateIncidentDto,
  EventIncidentReportDto,
  UpdateIncidentDto,
  IncidentDashboardReportOverviewDto,
  CreateImageDto,
  CreateCommentDto,
  DispatchIncidentDto,
  RemoveIncidentDepartmentDto,
  UploadIncidentDto,
  DashboardPdfDto,
  UpdateIncidentLegalStatusDto,
} from '../dto';

export const updateIncident = {
  type: UpdateIncidentDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        priority: 'low',
        status: 'open',
        incident_division_ids: [255, 299],
        reporter_id: 434,
        incident_type_id: 894,
        incident_zone_id: 2427,
        description: 'Testing',
        location_attributes: {
          latitude: 36.2791836737767,
          longitude: -115.018266939125,
        },
        logged_date_time: '2024-03-23T12:00:00.000Z',
        source_id: 431,
        locator_code: 'Testing',
        affected_person: 2,
        note: 'Test',
        resolved_status: 'arrest',
      },
    },
  },
};

export const updateIncidentLegalStatus = {
  type: UpdateIncidentLegalStatusDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        is_legal: true,
      },
    },
  },
};

export const createIncident = {
  type: CreateIncidentDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        priority: 'low',
        status: 'open',
        department_id: 434,
        incident_zone_id: 3290,
        incident_division_ids: [207],
        incident_type_id: 590,
        source_id: 404,
        description: 'Testing Description',
        location_attributes: {
          latitude: 36.2791836737767,
          longitude: -115.018266939125,
        },
        locator_code: 'Testing',
      },
    },
  },
};

export const uploadIncident = {
  type: UploadIncidentDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incidents: [
          {
            priority: 'low',
            status: 'open',
            incident_zone_id: 3289,
            incident_division_ids: [255],
            incident_type_id: 1017,
            description: 'Testing 1',
          },
          {
            priority: 'medium',
            status: 'dispatched',
            incident_zone_id: 3289,
            incident_division_ids: [255],
            incident_type_id: 1018,
            description: 'Testing 2',
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/d3d55c1717062030/Untitled%20spreadsheet%20-%20OnTrack%20Incident%20Upload%20Template.csv',
        file_name: 'incidents.csv',
      },
    },
  },
};

export const eventIncidentReport = {
  type: EventIncidentReportDto,
  examples: {
    Example: {
      value: {
        event_id: 1970,
        incident_id: 4020,
        with_changelogs: false,
      },
    },
  },
};

export const eventIncidentDashboardReport = {
  type: IncidentDashboardReportOverviewDto,
  examples: {
    Example: {
      value: {
        event_id: 1970,
        image_url:
          'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/8a5a801702310666/Screenshot%202023-12-11%20at%209.03.10%20PM.png',
      },
    },
  },
};

export const eventIncidentDashboardReportNew = {
  type: DashboardPdfDto,
  examples: {
    Example: {
      value: {
        image_url:
          'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/e0c1651721303942/Screenshot%202024-07-18%20at%204.55.29%C3%A2%C2%80%C2%AFPM.png',
        event_id: 2015,
        pdf: 'pdf',
        file_name: 'Event Incident Report Overview',
      },
    },
  },
};

export const createCommentBody = {
  type: CreateCommentDto,
  examples: {
    Example: {
      value: {
        incident_id: 5291,
        text: 'comment text',
      },
    },
  },
};

export const createImageBody = {
  type: CreateImageDto,
  examples: {
    Example: {
      value: {
        incident_id: 5291,
        name: 'mountain',
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/8a5a801702310666/Screenshot%202023-12-11%20at%209.03.10%20PM.png',
      },
    },
  },
};

export const dispatchIncidentBody = {
  type: DispatchIncidentDto,
  examples: {
    Example: {
      value: {
        incident_id: 123,
        event_id: 2222,
        department_staff: [
          {
            department_id: 637,
            user_id: 2380,
          },
        ],
      },
    },
  },
};

export const linkIncidentBody = {
  type: DispatchIncidentDto,
  examples: {
    Example: {
      value: {
        incident_id: 123,
        event_id: 2222,
        link_incident_ids: [123, 123, 122],
      },
    },
  },
};

export const unlinkIncidentDispatch = {
  type: RemoveIncidentDepartmentDto,
  examples: {
    Example: {
      value: {
        incident_id: 8076,
        user_id: 2089,
      },
    },
  },
};
