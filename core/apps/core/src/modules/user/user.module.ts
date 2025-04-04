import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import {
  ChangeLogModule,
  ChangeLogService,
  CommunicationService,
  MailService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { COMMUNICATIONS_CLIENT } from '@ontrack-tech-group/common/constants';
import { ImageModule } from '@Modules/image/image.module';
import { CompaniesModule } from '@Modules/company/company.module';
import { MailChimpService } from '@Common/services/mailchimp';
import { AppService } from 'src/app.service';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATIONS_CLIENT.COMMUNICATION, // Unique identifier for the client
        transport: Transport.TCP,
        options: {
          host: process.env.COMMUNICATION_MICRO_SERVICE_HOST,
          port: +process.env.COMMUNICATION_MICRO_SERVICE_PORT,
        },
      },
    ]),
    HttpModule,
    ConfigModule,
    ImageModule,
    CompaniesModule,
    ChangeLogModule,
  ],
  providers: [
    UserService,
    MailService,
    CommunicationService,
    PusherService,
    ChangeLogService,
    MailChimpService,
    AppService,
  ],
})
export class UsersModule {}
