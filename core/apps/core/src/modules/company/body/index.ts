import { CreateCompanyDto, UpdateCompanyDto } from '../dto';

export const createCompany = {
  type: CreateCompanyDto,
  examples: {
    Example: {
      value: {
        name: 'TechCorp Ltd.',
        logo: 'https://techcorp.com/logo.png',
        about: 'TechCorp is a leading provider of tech solutions worldwide.',
        url: 'https://www.techcorp.com',
        location: 'Silicon Valley, CA, USA',
        timezone: 'America/Los_Angeles',
        contact_name: 'John Doe',
        contact_phone: '+1-800-555-1234',
        contact_email: 'contact@techcorp.com',
        use_pay_fabric_live: true,
        company_token: 'abc123token456',
        active: true,
        country: 'USA',
        category: 'TECHNOLOGY',
        region_id: 5,
        demo_company: false,
        secondary_contacts: [
          {
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
        legal_contacts: [
          {
            name: 'Updated Legal Advisor Inc.',
            email: 'updated-legal@techcorp.com',
            number: '+1-800-555-7890',
          },
          {
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
      },
    },
  },
};

export const updateCompany = {
  type: UpdateCompanyDto,
  examples: {
    'Example 1': {
      value: {
        name: 'TechCorp Ltd.',
        logo: 'https://techcorp.com/logo.png',
        about: 'TechCorp is a leading provider of tech solutions worldwide.',
        url: 'https://www.techcorp.com',
        location: 'Silicon Valley, CA, USA',
        timezone: 'America/Los_Angeles',
        contact_name: 'John Doe',
        contact_phone: '+1-800-555-1234',
        contact_email: 'contact@techcorp.com',
        use_pay_fabric_live: true,
        company_token: 'abc123token456',
        active: true,
        country: 'USA',
        parent_id: 1,
        default_lang: 'en',
        category: 'TECHNOLOGY',
        region_id: 5,
        demo_company: false,
        secondary_contacts: [
          {
            id: 102,
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
        legal_contacts: [
          {
            id: 101,
            name: 'Updated Legal Advisor Inc.',
            email: 'updated-legal@techcorp.com',
            number: '+1-800-555-7890',
          },
          {
            id: 102,
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
      },
    },
    'Example 2': {
      value: {
        name: 'TechCorp Ltd.',
        logo: 'https://techcorp.com/logo.png',
        about: 'TechCorp is a leading provider of tech solutions worldwide.',
        url: 'https://www.techcorp.com',
        location: 'Silicon Valley, CA, USA',
        timezone: 'America/Los_Angeles',
        contact_name: 'John Doe',
        contact_phone: '+1-800-555-1234',
        contact_email: 'contact@techcorp.com',
        use_pay_fabric_live: true,
        company_token: 'abc123token456',
        active: true,
        country: 'USA',
        parent_id: 1,
        default_lang: 'en',
        category: 'TECHNOLOGY',
        region_id: 5,
        demo_company: false,
        legal_contacts: [],
        secondary_contacts: [],
      },
    },

    'Example 3': {
      value: {
        name: 'TechCorp Ltd.',
        logo: 'https://techcorp.com/logo.png',
        about: 'TechCorp is a leading provider of tech solutions worldwide.',
        url: 'https://www.techcorp.com',
        location: 'Silicon Valley, CA, USA',
        timezone: 'America/Los_Angeles',
        contact_name: 'John Doe',
        contact_phone: '+1-800-555-1234',
        contact_email: 'contact@techcorp.com',
        use_pay_fabric_live: true,
        company_token: 'abc123token456',
        active: true,
        country: 'USA',
        parent_id: 1,
        default_lang: 'en',
        category: 'TECHNOLOGY',
        region_id: 5,
        demo_company: false,
        secondary_contacts: [
          {
            id: 102,
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
        legal_contacts: [
          {
            name: 'Updated Legal Advisor Inc.',
            email: 'updated-legal@techcorp.com',
            number: '+1-800-555-7890',
          },
          {
            id: 102,
            name: 'Updated Smith & Associates',
            email: 'updated-smithlegal@techcorp.com',
            number: '+1-800-555-9999',
          },
        ],
      },
    },
  },
};
