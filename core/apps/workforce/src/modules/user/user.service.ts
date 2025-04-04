import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventUser, User } from '@ontrack-tech-group/common/models';
import { processTimeStamp } from '@ontrack-tech-group/common/helpers';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { SendStaffText } from './dto/send-staff-text.dto';
import { _ERRORS, _MESSAGES } from '@Common/constants';

@Injectable()
export class UserService {
  constructor(private readonly communicationService: CommunicationService) {}

  async getUserById(id: number) {
    try {
      const user: User = await User.findByPk(id, { raw: true });
      return processTimeStamp(user);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async sendStaffText(sendStaffText: SendStaffText) {
    const { event_id, user_id } = sendStaffText;
    const userNumbers: string[] = [];

    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'name', 'message_service'],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const user = await User.findByPk(user_id, {
      attributes: ['id', 'country_code', 'cell'],
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    if (!event.message_service)
      throw new InternalServerErrorException(
        'MESSAGES_ARE_DISABLED_ON_THIS_EVENT',
      );

    const eventUser = await EventUser.findOne({
      where: { event_id, user_id },
      attributes: ['uid'],
    });

    if (!eventUser)
      throw new NotFoundException(_ERRORS.USER_IS_NOT_LINKED_WITH_EVENT);

    const messageBody = `Tomorrow event ${event.name} is starting. Tap on link below: https://ontrackdevelopment.com/#/driver/${eventUser.uid}`;
    userNumbers.push(user.country_code + user.cell);

    const convertedObject = {
      messageBody,
      userNumbers,
    };

    await this.communicationService.communication(
      convertedObject,
      'send-message',
      user,
    );

    return { message: _MESSAGES.MESSAGE_SENT_SUCCESSFULLY };
  }
}
