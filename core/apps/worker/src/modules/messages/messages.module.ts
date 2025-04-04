import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SqsModule } from '@ssut/nestjs-sqs';
import { TwilioModule } from 'nestjs-twilio';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    SqsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          consumers: [
            {
              name: configService.get('SQS_QUEUE_NAME'), // name of the queue
              queueUrl: configService.get('SQS_QUEUE_URL'), // the url of the queue
              region: configService.get('SQS_REGION'),
              batchSize: Number(configService.get('SQS_QUEUE_BATCH_SIZE')), // 10
              attributeNames: ['All'],
              messageAttributeNames: ['All'],
              shouldDeleteMessages: false,
            },
          ],
          producers: [],
        };
      },
      inject: [ConfigService],
    }),

    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        accountSid: config.get('TWILIO_ACCOUNT_SID'),
        authToken: config.get('TWILIO_AUTH_TOKEN'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
