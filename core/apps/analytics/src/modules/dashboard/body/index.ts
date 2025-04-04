import { EventIdsBodyDto } from '@ontrack-tech-group/common/dto';
import {
  ComparisonEventGraphCsvPdfDto,
  ComparisonEventGraphPdfDto,
  ComparisonEventLineGraphDto,
  ComparisonEventPieGraphDto,
  ComparisonEventsDataDto,
  PinDashboardEventDto,
} from '../dto';

export const pinDashboardEvent = {
  type: PinDashboardEventDto,
  examples: {
    Example: {
      value: {
        event_orders: [
          { event_id: 2015, order: 0 },
          { event_id: 2039, order: 1 },
        ],
      },
    },
  },
};

export const comparisonEventsData = {
  type: ComparisonEventsDataDto,
  examples: {
    Example: {
      value: {
        event_ids: [2015, 2039],
      },
    },
  },
};

export const comparisonEventsDataLineGraph = {
  type: ComparisonEventLineGraphDto,
  examples: {
    Example1: {
      value: {
        event_ids: [2015, 2039],
      },
    },
    Example2: {
      value: {
        incident_division_id: 210,
        incident_status: 'open',
        incident_type_id: 590,
        department_id: 530,
        incident_priority: 'low',
        event_ids: [2015, 2039],
        day: 1,
      },
    },
  },
};

export const comparisonEventsDataPieGraph = {
  type: ComparisonEventPieGraphDto,
  examples: {
    Example1: {
      value: {
        event_ids: [2015, 2039],
      },
    },
    Example2: {
      value: {
        incident_division_id: 210,
        incident_status: 'open',
        incident_type_id: 590,
        department_id: 530,
        incident_priority: 'low',
        event_ids: [2015, 2039],
      },
    },
  },
};

export const eventIds = {
  type: EventIdsBodyDto,
  examples: {
    Example: {
      value: {
        event_ids: [2015, 2039],
      },
    },
  },
};

export const comparisonEventsDataCsvPdf = {
  type: ComparisonEventGraphCsvPdfDto,
  examples: {
    Example1: {
      value: {
        event_ids: [2015, 2039],
      },
    },
    Example2: {
      value: {
        incident_division_id: 210,
        incident_status: 'open',
        incident_type_id: 590,
        department_id: 530,
        incident_priority: 'low',
        event_ids: [2015, 2039],
      },
    },
  },
};

export const comparisonEventsDataPdf = {
  type: ComparisonEventGraphPdfDto,
  examples: {
    Example1: {
      value: {
        event_ids: [2015, 2039],
        day: null,
      },
    },
    Example2: {
      value: {
        incident_division_id: 210,
        incident_status: 'open',
        incident_type_id: 590,
        department_id: 530,
        incident_priority: 'low',
        event_ids: [2015, 2039],
      },
    },
  },
};
