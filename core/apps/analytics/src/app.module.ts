import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { PusherService, AuthModule } from '@ontrack-tech-group/common/services';
import { UsersModule } from '@Modules/user/user.module';
import { DashboardModule } from '@Modules/dashboard/dashboard.module';
import { PresetModule } from '@Modules/preset/preset.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    UsersModule,
    AuthModule,
    DashboardModule,
    PresetModule,
  ],
  controllers: [AppController],
  providers: [AppService, PusherService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
