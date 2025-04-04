import { Module } from '@nestjs/common';
import { CompanyWeatherProviderController } from './company-weather-provider.controller';
import { CompanyWeatherProviderService } from './company-weather-provider.service';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [CompanyWeatherProviderController],
  providers: [CompanyWeatherProviderService, PusherService],
})
export class CompanyWeatherProviderModule {}
