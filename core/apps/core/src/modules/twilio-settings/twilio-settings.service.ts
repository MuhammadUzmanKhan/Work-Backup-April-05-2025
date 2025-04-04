import { WhereOptions } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TwilioNumber,
  Company,
  User,
  EventTwilioNumbers,
  Event,
} from '@ontrack-tech-group/common/models';
import {
  EventStatus,
  EventStatusAPI,
  Options,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import {
  getCompanyScope,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  AddTwilioConfigurationsDto,
  AddTwilioNumberDto,
  GetLinkedEventsDto,
  LinkEventTwilioNumberDto,
  UpdateTwilioConfigurationsDto,
  UpdateTwilioNumberDto,
} from './dto';
import {
  checkTwillioNumberExist,
  checkTwillioSettingExist,
  getEventLinkedNumberById,
  getTwilioNumberById,
} from './helpers';

@Injectable()
export class TwilioSettingsService {
  async addTwilioConfigurations(
    addTwilioConfigurationsDto: AddTwilioConfigurationsDto,
    user: User,
  ) {
    const { company_id } = addTwilioConfigurationsDto;

    // check if user have correct company access
    await getCompanyScope(user, company_id);

    await checkTwillioSettingExist(company_id, addTwilioConfigurationsDto);

    await Company.update(addTwilioConfigurationsDto, {
      where: { id: company_id },
    });

    return await this.getTwillioSettings(company_id, user, { useMaster: true });
  }

  async addTwilioNumber(addTwilioNumber: AddTwilioNumberDto, user: User) {
    const { company_id, phone_number } = addTwilioNumber;

    // check if user have correct company access
    await getCompanyScope(user, company_id);

    // if this number already exist against this company throwing error
    await checkTwillioNumberExist(phone_number, company_id);

    const createdNumber = await TwilioNumber.create({ ...addTwilioNumber });

    return await getTwilioNumberById(createdNumber.id, {
      useMaster: true,
    });
  }

  async linkEventToTwilioNumber(
    linkEventTwilioNumberDto: LinkEventTwilioNumberDto,
    user: User,
  ) {
    const { event_id, twilio_number_id, inbox_name } = linkEventTwilioNumberDto;

    // check if user have correct company access
    await withCompanyScope(user, event_id);

    const [linkedNumber] = await EventTwilioNumbers.findOrCreate({
      where: { event_id, twilio_number_id, inbox_name },
    });

    return linkedNumber;
  }

  async getTwillioSettings(id: number, user: User, options?: Options) {
    // check if user have correct company access
    await getCompanyScope(user, id);

    const company = await Company.findByPk(id, {
      attributes: [
        'id',
        'name',
        'twilio_api_key_sid',
        'twilio_api_key_secret',
        'twilio_account_sid',
      ],
      include: [
        {
          model: TwilioNumber,
          required: false,
          attributes: ['id', 'phone_number', 'is_enabled'],
          include: [
            {
              model: Event,
              attributes: ['name', 'status'],
            },
          ],
        },
      ],
      ...options,
    });

    // Transform the company object with formatted twilioNumbers
    const formattedCompany = {
      ...company.toJSON(),
      twilio_numbers: company.twilio_numbers.map((twilio) => {
        return {
          id: twilio.id,
          phone_number: twilio.phone_number,
          is_enabled: twilio.is_enabled,
          events: twilio.events.map((event) => event.name),
          currentEvents: twilio.events
            .filter((event) => event.status === EventStatus.IN_PROGRESS)
            .map((event) => event.name),
        };
      }),
    };

    return formattedCompany;
  }
  async getLinkedEventsByTwilioNumbers(
    getLinkedEventsDto: GetLinkedEventsDto,
    user: User,
  ) {
    const { twilio_number_id, status } = getLinkedEventsDto;

    const twilioNumber = await getTwilioNumberById(twilio_number_id);
    if (!twilioNumber)
      throw new NotFoundException(RESPONSES.notFound('Twilio Number'));

    // check if user have correct company access
    await getCompanyScope(user, twilioNumber.company_id);

    const _where: WhereOptions = { company_id: twilioNumber.company_id };

    if (status) {
      _where['status'] = {
        [EventStatusAPI.UPCOMING]: EventStatus.UPCOMING,
        [EventStatusAPI.IN_PROGRESS]: EventStatus.IN_PROGRESS,
        [EventStatusAPI.COMPLETED]: EventStatus.COMPLETED,
        [EventStatusAPI.ON_HOLD]: EventStatus.ON_HOLD,
      }[status];
    }

    return await EventTwilioNumbers.findAll({
      where: {
        twilio_number_id,
      },
      attributes: { exclude: ['updatedAt', 'createdAt'] },
      include: [
        {
          model: Event,
          attributes: [
            'id',
            'company_id',
            'name',
            [Event.getStatusNameByKey, 'status'],
          ],
          where: _where,
        },
        {
          model: TwilioNumber,
          attributes: { exclude: ['updatedAt', 'createdAt'] },
        },
      ],
    });
  }

  async updateTwilioSettings(
    id: number,
    updateTwilioConfigurationsDto: UpdateTwilioConfigurationsDto,
    user: User,
  ) {
    // check if user have correct company access
    await getCompanyScope(user, id);

    // checking if configuration already exist
    await checkTwillioSettingExist(id, updateTwilioConfigurationsDto);

    await Company.update(updateTwilioConfigurationsDto, {
      where: { id },
    });

    return await this.getTwillioSettings(id, user, { useMaster: true });
  }

  async updateTwilioNumber(
    id: number,
    updateTwilioNumberDto: UpdateTwilioNumberDto,
    user: User,
  ) {
    const { phone_number } = updateTwilioNumberDto;

    const twilioNumber = await getTwilioNumberById(id);
    if (!twilioNumber)
      throw new NotFoundException(RESPONSES.notFound('Twilio Number'));

    // check if user have correct company access
    await getCompanyScope(user, twilioNumber.company_id);

    await checkTwillioNumberExist(phone_number, twilioNumber.company_id, id);

    await twilioNumber.update({ ...updateTwilioNumberDto });

    return await getTwilioNumberById(twilioNumber.id, { useMaster: true });
  }

  async unlinkEventToTwilioNumber(event_twilio_number_id: number) {
    const eventTwilioNumber = await getEventLinkedNumberById(
      event_twilio_number_id,
    );
    if (!eventTwilioNumber)
      throw new NotFoundException(
        RESPONSES.notFound('Event Linking with Twilio Number'),
      );

    await EventTwilioNumbers.destroy({
      where: { id: event_twilio_number_id },
    });

    return {
      message: RESPONSES.destroyedSuccessfully('Link with Twillio Number'),
    };
  }
}
