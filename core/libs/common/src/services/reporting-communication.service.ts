import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { COMMUNICATIONS_CLIENT } from '../constants';
import { sendCommunicationMessage } from '../helpers';
import { User } from '../models';

export class ReportingCommunicationService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.REPORTING)
    private readonly communicationClient: ClientProxy,
  ) {}

  public async communication(
    body: {},
    communicationString: string,
    user?: User,
  ) {
    return await sendCommunicationMessage(
      body,
      communicationString,
      this.communicationClient,
      user,
    );
  }
}
