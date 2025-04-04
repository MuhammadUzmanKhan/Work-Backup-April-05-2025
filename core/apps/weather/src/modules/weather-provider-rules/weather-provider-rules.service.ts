import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateWeatherProviderRulesDto,
  UpdateWeatherProviderRulesDto,
} from './dto';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { WeatherRule } from '@ontrack-tech-group/common/models';

@Injectable()
export class WeatherProviderRulesService {
  async createWeatherProviderRule(
    createWeatherProviderRulesDto: CreateWeatherProviderRulesDto,
  ) {
    const weatherRule = await WeatherRule.create({
      ...createWeatherProviderRulesDto,
    });
    return this.getWeatherRulesById(weatherRule.id);
  }

  async getWeatherRulesById(id: number) {
    return await WeatherRule.findOne({
      where: {
        id,
      },
    });
  }

  async updateWeatherProviderRule(
    id: number,
    updateWeatherProviderRulesDto: UpdateWeatherProviderRulesDto,
  ) {
    const weatherRule = await this.getWeatherRulesById(id);

    if (!weatherRule)
      throw new NotFoundException(RESPONSES.notFound('Weather'));

    return await weatherRule.update({
      ...updateWeatherProviderRulesDto,
    });
  }
}
