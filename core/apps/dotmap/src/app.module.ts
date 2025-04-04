import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { AuthModule } from '@ontrack-tech-group/common/services';
import { DotModule } from '@Modules/dot/dot.module';
import { VendorModule } from '@Modules/vendor/vendor.module';
import { PositionModule } from '@Modules/position/position.module';
import { ShiftModule } from '@Modules/shift/shift.module';
import { AreaModule } from '@Modules/area/area.module';
import { PositionNameModule } from '@Modules/position-name/position-name.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    AuthModule,
    DotModule,
    VendorModule,
    PositionModule,
    ShiftModule,
    PositionNameModule,
    AreaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
