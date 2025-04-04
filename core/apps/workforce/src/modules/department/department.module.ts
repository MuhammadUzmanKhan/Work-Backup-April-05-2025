import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PusherService } from '@ontrack-tech-group/common/services';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
dotenv.config();

@Module({
  imports: [
    ConfigModule,
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
    HttpModule,
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService, PusherService],
})
export class DepartmentModule {}
