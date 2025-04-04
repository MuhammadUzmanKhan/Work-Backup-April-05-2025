import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { AuthModule } from '@ontrack-tech-group/common/services';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherProviderModule } from '@Modules/weather-provider/weather-provider.module';
import { CompanyWeatherProviderModule } from '@Modules/company-weather-provider/company-weather-provider.module';
import { WeatherProviderRuleModule } from '@Modules/weather-provider-rules/weather-provider-rules.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    AuthModule,
    WeatherProviderModule,
    CompanyWeatherProviderModule,
    WeatherProviderRuleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
