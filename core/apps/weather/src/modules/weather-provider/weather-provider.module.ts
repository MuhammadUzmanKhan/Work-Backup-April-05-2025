import { Module } from '@nestjs/common';
import { WeatherProviderController } from './weather-provider.controller';
import { WeatherProviderService } from './weather-provider.service';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [WeatherProviderController],
  providers: [WeatherProviderService, PusherService],
})
export class WeatherProviderModule {}
