import { CreateVendorDto } from '../dto';

export const createVendor = {
  type: CreateVendorDto,
  examples: {
    Example1: {
      value: {
        name: 'Karachi Biryani',
        first_name: 'John',
        last_name: 'Wick',
        cell: '4155551414',
        country_code: '+1',
        country_iso_code: 'us',
        contact_email: 'test@gmail.com',
        color: '#fffff',
        note: 'testing vendor for supply biryani daig.',
        company_id: 6,
      },
    },
    Example2: {
      value: {
        name: 'Madina Yakhni Pulao',
        cell: '4155551415',
        country_code: '+1',
        country_iso_code: 'us',
        company_id: 6,
      },
    },
  },
};
