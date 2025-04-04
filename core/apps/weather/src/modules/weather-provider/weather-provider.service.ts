import { Injectable } from '@nestjs/common';
import {
  CreateWeatherProviderDto,
  GetAllWeatherProviderDto,
  UpdateWeatherProviderDto,
} from './dto';
import {
  CompanyWeatherProvider,
  WeatherProvider,
  User,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  CreateWeatherProviderInput,
  WeatherProviderRequestStatus,
} from '@Common/constants';
import { getAllWeatherProviderWhere } from './helper';
import { getWeatherProviderById } from '@Common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';

@Injectable()
export class WeatherProviderService {
  constructor(private readonly pusherService: PusherService) {}

  async createWeatherProvider(
    createWeatherProviderDto: CreateWeatherProviderDto,
    user: User,
    request?: boolean,
  ) {
    const createData: CreateWeatherProviderInput = {
      ...createWeatherProviderDto,
    };

    if (request) {
      (createData.requested_by = user.id),
        (createData.request_status = WeatherProviderRequestStatus.REQUESTED);
    }

    const weatherProvider = await WeatherProvider.create({
      ...createData,
    });

    const weatherProvierData = await getWeatherProviderById(weatherProvider.id);

    try {
      this.pusherService.sendWeatherProviderUpdate(weatherProvierData);
    } catch (e) {
      console.log('🚀 ~ CompanyWeatherProviderService ~ e:', e);
    }

    return weatherProvierData;
  }

  async getAllWeatherProviders(
    getAllWeatherProviderDto: GetAllWeatherProviderDto,
  ) {
    const { company_id, keyword } = getAllWeatherProviderDto;

    return await WeatherProvider.findAll({
      where: getAllWeatherProviderWhere(keyword),
      attributes: ['id', 'name', 'url', 'created_at'],
      include: [
        {
          model: CompanyWeatherProvider,
          where: company_id ? { company_id: company_id } : {},
          attributes: ['id', 'api_key', 'api_secret'],
          required: false,
        },
      ],
      order: [['created_at', SortBy.DESC]],
    });
  }

  async updateWeatherProvider(
    id: number,
    updateWeatherProviderDto: UpdateWeatherProviderDto,
  ) {
    const weatherProvider = await getWeatherProviderById(id);

    await weatherProvider.update({
      ...updateWeatherProviderDto,
    });

    const weatherProvierData = await getWeatherProviderById(id);

    this.pusherService.sendWeatherProviderUpdate(weatherProvierData);

    return weatherProvierData;
  }
}
