import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { COMMUNICATIONS_CLIENT } from '../constants';
import { sendCommunicationMessage } from '../helpers';
import { User } from '../models';

export class KafkaService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.KAFKA)
    private readonly client: ClientProxy,
  ) {}

  public async kafkaCommunication(
    body: {},
    communicationString: string,
    user?: User,
  ) {
    try {
      return await sendCommunicationMessage(
        body,
        communicationString,
        this.client,
        user,
      );
    } catch (e) {
      console.log('Error in kafka communication ', e);
    }
  }
}
