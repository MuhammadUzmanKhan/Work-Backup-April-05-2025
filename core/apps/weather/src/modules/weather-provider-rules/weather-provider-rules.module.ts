import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherProviderRulesController } from './weather-provider-rules.controller';
import { WeatherProviderRulesService } from './weather-provider-rules.service';

@Module({
  imports: [HttpModule],
  controllers: [WeatherProviderRulesController],
  providers: [WeatherProviderRulesService],
})
export class WeatherProviderRuleModule {}
