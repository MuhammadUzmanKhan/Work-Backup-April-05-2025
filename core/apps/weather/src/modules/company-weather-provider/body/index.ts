import {
  CreateCompanyWeatherProviderDto,
  UpdateCompanyWeatherProviderDto,
} from '../dto';

export const createCompanyWeatherProviderBody = {
  type: CreateCompanyWeatherProviderDto,
  examples: {
    Example: {
      value: {
        api_key: 'api-key',
        api_secret: 'api-secret',
        weather_provider_id: 123,
        company_id: 1,
      },
    },
  },
};

export const updateCompanyWeatherProviderBody = {
  type: UpdateCompanyWeatherProviderDto,
  examples: {
    Example: {
      value: {
        api_key: 'api-key',
        api_secret: 'api-secret',
      },
    },
  },
};
