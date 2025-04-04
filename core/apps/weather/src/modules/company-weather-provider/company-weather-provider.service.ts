import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  CreateCompanyWeatherProviderDto,
  UpdateCompanyWeatherProviderDto,
} from './dto';
import { CompanyWeatherProvider } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { isCompanyExist } from '@ontrack-tech-group/common/helpers';
import { _ERRORS } from '@Common/constants/responses';
import { getCompanyWeatherProvider } from './helpers';

@Injectable()
export class CompanyWeatherProviderService {
  constructor(private readonly pusherService: PusherService) {}

  async createCompanyWeatherProvider(
    createCompanyWeatherProviderDto: CreateCompanyWeatherProviderDto,
  ) {
    const { weather_provider_id, company_id } = createCompanyWeatherProviderDto;

    await isCompanyExist(company_id);

    const existingProvider = await getCompanyWeatherProvider(
      null,
      weather_provider_id,
      company_id,
    );

    if (existingProvider)
      throw new UnprocessableEntityException(
        _ERRORS.COMPANY_WITH_SAME_PROVIDER_EXISTS,
      );

    const companyProvider = await CompanyWeatherProvider.create({
      ...createCompanyWeatherProviderDto,
    });

    try {
      this.pusherService.sendCompanyWeatherProviderUpdate(
        companyProvider,
        weather_provider_id,
      );
    } catch (e) {
      console.log('🚀 ~ CompanyWeatherProviderService ~ e:', e);
    }

    return companyProvider;
  }

  async updateCompanyWeatherProvider(
    id: number,
    updateCompanyWeatherProviderDto: UpdateCompanyWeatherProviderDto,
  ) {
    const companyWeatherProvider = await getCompanyWeatherProvider(id);

    const updatedData = await companyWeatherProvider.update({
      ...updateCompanyWeatherProviderDto,
    });

    try {
      this.pusherService.sendCompanyWeatherProviderUpdate(updatedData, id);
    } catch (e) {
      console.log('🚀 ~ CompanyWeatherProviderService ~ e:', e);
    }

    return updatedData;
  }
}
