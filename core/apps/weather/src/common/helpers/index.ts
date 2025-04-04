import { NotFoundException } from '@nestjs/common';
import { WeatherProvider } from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';

export const getWeatherProviderById = async (id: number) => {
  const weatherProvider = await WeatherProvider.findOne({
    where: { id },
  });

  if (!weatherProvider)
    throw new NotFoundException(RESPONSES.notFound('Weather Provider'));

  return weatherProvider;
};
