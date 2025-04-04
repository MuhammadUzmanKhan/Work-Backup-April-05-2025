import { Injectable, NotFoundException } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';
import { EventContact, User } from '@ontrack-tech-group/common/models';
import { SocketTypes, _ERRORS } from '@Common/constants';
import {
  isEventExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { UpdateEventContactDto, CreateEventContactDto } from './dto';
import {
  alreadyEventContactExist,
  getEventContact,
  sendUpdatedEventContact,
} from './helper';

@Injectable()
export class EventContactService {
  constructor(private readonly pusherService: PusherService) {}

  async updateEventContact(
    id: number,
    updateEventContactDto: UpdateEventContactDto,
  ) {
    const { event_id, contact_phone, country_code } = updateEventContactDto;

    await alreadyEventContactExist(contact_phone, country_code, id);

    // fetching event contact by it's ID
    const eventContact = await EventContact.findOne({
      where: { id },
    });

    if (!eventContact)
      throw new NotFoundException(_ERRORS.EVENT_CONTACT_NOT_FOUND);

    await eventContact.update(updateEventContactDto);

    const updatedEventContact = await getEventContact(id, { useMaster: true });

    sendUpdatedEventContact(
      { eventContact: updatedEventContact },
      event_id,
      'update',
      SocketTypes.EVENT_CONTACT,
      false,
      this.pusherService,
    );

    return updatedEventContact;
  }

  async createEventContact(
    createEventContactDto: CreateEventContactDto,
    user: User,
  ) {
    const { event_id, contact_phone, country_code } = createEventContactDto;

    await isEventExist(event_id);

    const info_type = 1;

    await alreadyEventContactExist(contact_phone, country_code);

    const [company_id] = await withCompanyScope(user, event_id);

    const newEventContact = await EventContact.create({
      ...createEventContactDto,
      company_id,
      info_type,
    });

    const eventContact = await getEventContact(newEventContact.id, {
      useMaster: true,
    });

    sendUpdatedEventContact(
      { eventContact },
      event_id,
      'new',
      SocketTypes.EVENT_CONTACT,
      true,
      this.pusherService,
    );

    return eventContact;
  }
}
