import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { COMMUNICATIONS_CLIENT } from '../constants';
import { sendCommunicationMessage } from '../helpers';
import { User } from '../models';

export class CoreService {
  constructor(
    @Inject(COMMUNICATIONS_CLIENT.CORE)
    private readonly communicationClient: ClientProxy,
  ) {}

  public async communicate(body: {}, communicationString: string, user?: User) {
    return await sendCommunicationMessage(
      body,
      communicationString,
      this.communicationClient,
      user,
    );
  }
}
