import { ClientsModule, Transport } from '@nestjs/microservices';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { PusherService, AuthModule } from '@ontrack-tech-group/common/services';
import { UsersModule } from '@Modules/user/user.module';
import { DepartmentModule } from '@Modules/department/department.module';
import { InventoryTypeModule } from '@Modules/inventory-type/inventory-type.module';
import { InventoryZoneModule } from '@Modules/inventory-zone/inventory-zone.module';
import { InventoryTypeCategoryModule } from '@Modules/inventory-type-category/inventory-type-category.module';
import { InventoryModule } from '@Modules/inventory/inventory.module';
import { PointOfInterestModule } from '@Modules/point-of-interest/point-of-interest.module';
import { PointOfInterestTypeModule } from '@Modules/point-of-interest-type/point-of-interest-type.module';
import { SchedulingModule } from '@Modules/scheduling/scheduling.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

dotenv.config();

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ontrack-core',
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_MICRO_SERVICE_HOST,
          port: +process.env.CORE_MICRO_SERVICE_PORT,
        },
      },
    ]),
    DatabaseModule,
    ConfigModule.forRoot(),
    UsersModule,
    AuthModule,
    DepartmentModule,
    InventoryTypeModule,
    InventoryZoneModule,
    InventoryTypeCategoryModule,
    InventoryModule,
    PointOfInterestModule,
    PointOfInterestTypeModule,
    SchedulingModule,
  ],
  controllers: [AppController],
  providers: [AppService, PusherService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
