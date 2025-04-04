import { WeatherProviderRequestStatus } from './enums';

export interface CreateWeatherProviderInput {
  name: string;
  url: string;
  requested_by?: number;
  request_status?: WeatherProviderRequestStatus;
}
