import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import Telnyx from 'telnyx';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { TwilioService } from 'nestjs-twilio';
import { SmsConfig } from '@Common/interfaces';
import { CreateMessageDto, UserNumbersDto } from './dto/create-messages.dto';

@Injectable()
export class MessagesService {
  sqs: AWS.SQS;
  telnyx: Telnyx;
  phoneNumbers: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly twilioService: TwilioService,
  ) {
    // Set the region and access keys for the SQS service
    AWS.config.update({
      region: this.configService.get('SQS_REGION'),
      accessKeyId: this.configService.get('SQS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('SQS_SECRET_ACCESS_KEY'),
    });
    // Initializing SQS
    this.sqs = new AWS.SQS();

    // Initializing Telnyx
    this.telnyx = new Telnyx(this.configService.get('TELNYX_API_KEY'));

    this.phoneNumbers = this.configService
      .get('TELNYX_PHONE_NUMBERS')
      ?.split(',');
  }

  async createMessages(userNumbersWithMessage: CreateMessageDto) {
    userNumbersWithMessage.userNumbers.map((userNumbersDto: UserNumbersDto) => {
      const { cell, sender_cell } = userNumbersDto;

      const params = {
        QueueUrl: this.configService.get('SQS_QUEUE_URL'),
        MessageAttributes: {
          phone: {
            DataType: 'String',
            StringValue: cell,
          },
          sender: {
            DataType: 'String',
            StringValue: sender_cell,
          },
        },
        MessageBody: `${userNumbersWithMessage.messageBody}`,
        MessageGroupId: crypto.randomBytes(5).toString('hex'), // A unique alphanumeric required
        MessageDeduplicationId: crypto.randomBytes(5).toString('hex'), // A unique alphanumeric required
      };

      // Send the message to the SQS queue
      return new AWS.SQS().sendMessage(params).promise();
    });

    return { success: true };
  }

  @SqsMessageHandler(`${process.env['SQS_QUEUE_NAME']}`, true)
  async handleMessage(messages: AWS.SQS.Message[]) {
    // This will contain N number of random phone numbers from the available numbers. Here N will be length of messages consumed
    const _phoneNumbers = this.getRandomPhoneNumbers(
      this.phoneNumbers,
      messages.length,
    );

    messages.map(async (message, index) => {
      const smsConfig = {
        body: message.Body,
        to: message.MessageAttributes.phone.StringValue,
        from: message.MessageAttributes.sender.StringValue,
        twilioNumber: message.MessageAttributes.twilioNumber?.StringValue,
      };

      try {
        if (smsConfig.twilioNumber) {
          await this.handleTwilioMessage(
            smsConfig,
            message,
            _phoneNumbers[index],
          );
        } else {
          await this.handleTelnyxMessage(
            smsConfig,
            message,
            _phoneNumbers[index],
          );
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  private getRandomPhoneNumbers(phoneNumbers: string[], batchSize: number) {
    const uniquePhones = [...phoneNumbers];
    const shuffledPhones = uniquePhones.sort(() => Math.random() - 0.5);
    return shuffledPhones.slice(0, batchSize);
  }

  private async handleTelnyxMessage(
    smsConfig: SmsConfig,
    message: AWS.SQS.Message,
    defaultNumber: string,
  ) {
    const { to, from, body } = smsConfig;
    try {
      // Sending Message to user
      this.telnyx.messages.create(
        {
          to, // User phone number
          from: from || defaultNumber, // Your Telnyx number
          text: body,
        },
        async (err: any) => {
          console.log('Error in sending message: ', err);
          // status code 409 is for error code in case of message failed due to STOP, BLOCK, etc
          if (!err || (err && err.statusCode === 409)) {
            // Delete the message from the SQS queue
            await this.deleteMessageFromSQS(message);
          }
        },
      );
    } catch (e) {
      console.log(e);
    }
  }

  private async handleTwilioMessage(
    smsConfig: SmsConfig,
    message: AWS.SQS.Message,
    defaultNumber: string,
  ) {
    const { twilioNumber, to, body } = smsConfig;

    try {
      await this.twilioService.client.messages.create(
        {
          body,
          to,
          from: twilioNumber,
        },
        async (err: any) => {
          console.log('Error in sending message: ', err);
          // status code 21610 is for error code in case of message failed due to STOP, BLOCK, etc
          if (!err || (err && err.statusCode === 21610)) {
            // Delete the message from the SQS queue
            await this.deleteMessageFromSQS(message);
          } else if (err) {
            // in case of any error from twilio, we need to send message from telnyx
            await this.handleTelnyxMessage(smsConfig, message, defaultNumber);
          }
        },
      );
    } catch (error) {
      console.log('🚀 ~ MessagesService ~ handleTwilioMessage ~ error:', error);
    }
  }

  private async deleteMessageFromSQS(message: AWS.SQS.Message) {
    const deleteParams = {
      QueueUrl: this.configService.get('SQS_QUEUE_URL'),
      ReceiptHandle: message.ReceiptHandle,
    };
    await this.sqs.deleteMessage(deleteParams).promise();
  }
}
