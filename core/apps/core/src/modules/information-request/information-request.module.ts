import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InformationRequestService } from './information-request.service';
import { InformationRequestController } from './information-request.controller';

@Module({
  controllers: [InformationRequestController],
  providers: [InformationRequestService, CommunicationService],
  imports: [
    ConfigModule,
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
  ],
})
export class InformationRequestModule {}
