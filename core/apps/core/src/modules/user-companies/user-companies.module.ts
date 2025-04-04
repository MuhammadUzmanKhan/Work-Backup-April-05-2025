import { Module } from '@nestjs/common';
import {
  ChangeLogModule,
  CommunicationService,
} from '@ontrack-tech-group/common/services';
import { UserCompaniesService } from './user-companies.service';
import { UserCompaniesController } from './user-companies.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [UserCompaniesController],
  imports: [
    ClientsModule.register([
      {
        name: 'ontrack-communication', // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    ChangeLogModule,
  ],
  providers: [UserCompaniesService, CommunicationService],
})
export class UserCompaniesModule {}
