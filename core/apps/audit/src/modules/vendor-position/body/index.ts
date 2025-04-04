import { CreateVendorPositionDto } from '../dto';

export const createVendorPosition = {
  type: CreateVendorPositionDto,
  examples: {
    Example1: {
      value: {
        name: 'Software Engineer',
        company_id: 6,
      },
    },
    Example2: {
      value: {
        name: 'Architecture',
        company_id: 6,
      },
    },
  },
};
