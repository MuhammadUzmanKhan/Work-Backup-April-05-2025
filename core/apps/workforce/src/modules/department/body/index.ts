import { CreateDepartmentDto } from '../dto';

export const createDepartment = {
  type: CreateDepartmentDto,
  examples: {
    Example: {
      value: {
        name: 'Department Name',
        event_id: 2015,
      },
    },
    'Example of Company-Id Usage': {
      value: {
        name: 'Department Name',
        company_id: 6,
      },
    },
  },
};
