import {
  DeploymentPdfDto,
  GetBudgetSummaryPdfDto,
  UpdateVendorsDto,
} from '../dto';

export const updateVendors = {
  type: UpdateVendorsDto,
  examples: {
    'Example 1': {
      value: {
        vendors: [
          {
            id: 11,
            name: 'ABS-Recruiting',
          },
          {
            id: 12,
            name: 'R10- Recruiting',
          },
          {
            id: 13,
            name: 'WS-Agency',
            color: '#876656',
          },
        ],
        company_id: 6,
        event_id: 2015,
      },
    },
    'Example 2': {
      value: {
        vendors: [
          {
            id: 4,
            name: 'MYP',
          },
        ],
        company_id: 6,
        event_id: 2015,
      },
    },
  },
};

export const downloadDeploymentPdf = {
  type: DeploymentPdfDto,
  examples: {
    Example: {
      value: {
        image_url:
          'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/2195c71725884451/blob',
        event_id: 2015,
        filename: 'Test',
      },
    },
  },
};

export const downloadBudgetSummaryPdf = {
  type: GetBudgetSummaryPdfDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        filename: 'Test',
      },
    },
  },
};
