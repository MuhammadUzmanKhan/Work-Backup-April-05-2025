import { WeatherProviderRequestStatus } from '@Common/constants';
import { CreateWeatherProviderDto, UpdateWeatherProviderDto } from '../dto';

export const createWeatherProviderBody = {
  type: CreateWeatherProviderDto,
  examples: {
    Example: {
      value: {
        name: 'Accu Weather',
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/db3e6b1698321218/Sources%20-%20upload_incident_types.csv',
      },
    },
  },
};

export const updateWeatherProviderBody = {
  type: UpdateWeatherProviderDto,
  examples: {
    Example: {
      value: {
        name: 'Accu Weather',
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/db3e6b1698321218/Sources%20-%20upload_incident_types.csv',
        request_status: WeatherProviderRequestStatus.APPROVED,
      },
    },
  },
};
