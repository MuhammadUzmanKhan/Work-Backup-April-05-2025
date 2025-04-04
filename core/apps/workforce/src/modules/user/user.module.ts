import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
@Module({
  controllers: [UserController],
  providers: [UserService, CommunicationService],
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION,
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
  ],
})
export class UsersModule {}
