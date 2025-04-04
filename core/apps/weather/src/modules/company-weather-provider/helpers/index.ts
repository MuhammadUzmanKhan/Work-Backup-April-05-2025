import { CompanyWeatherProvider } from '@ontrack-tech-group/common/models';

export const getCompanyWeatherProvider = async (
  id?: number,
  weather_provider_id?: number,
  company_id?: number,
) => {
  return await CompanyWeatherProvider.findOne({
    where: weather_provider_id
      ? {
          weather_provider_id,
          company_id,
        }
      : { id },
    attributes: ['id'],
  });
};
