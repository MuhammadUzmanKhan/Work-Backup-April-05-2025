import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { COMMUNICATIONS_CLIENT } from '../constants';
import { sendCommunicationMessage } from '../helpers';
import { User } from '../models';

export class AnalyticCommunicationService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.ANALYTICS)
    private readonly analyticClient: ClientProxy,
  ) {}

  public async analyticCommunication(
    body: {},
    communicationString: string,
    user?: User,
  ) {
    try {
      return await sendCommunicationMessage(
        body,
        communicationString,
        this.analyticClient,
        user,
      );
    } catch (e) {
      console.log('Error in analytic communication ', e);
    }
  }
}
