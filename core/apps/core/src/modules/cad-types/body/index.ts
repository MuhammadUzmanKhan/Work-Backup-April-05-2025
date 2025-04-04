import { CreateUpdateCadTypeDto } from '../dto';

export const createCadType = {
  type: CreateUpdateCadTypeDto,
  examples: {
    Example: {
      value: {
        name: 'Cad Type Name',
        company_id: 6,
      },
    },
  },
};

export const updateCadType = {
  type: CreateUpdateCadTypeDto,
  examples: {
    Example: { value: { name: 'Updated the Cad Type Name', company_id: 6 } },
  },
};
