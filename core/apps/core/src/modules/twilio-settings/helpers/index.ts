import { Op, WhereOptions } from 'sequelize';
import { ConflictException } from '@nestjs/common';
import {
  Company,
  Event,
  EventTwilioNumbers,
  TwilioNumber,
} from '@ontrack-tech-group/common/models';
import { Options, RESPONSES } from '@ontrack-tech-group/common/constants';
import {
  AddTwilioConfigurationsDto,
  UpdateTwilioConfigurationsDto,
} from '../dto';

export const checkTwillioSettingExist = async (
  id: number,
  addTwilioConfigurationsDto:
    | AddTwilioConfigurationsDto
    | UpdateTwilioConfigurationsDto,
) => {
  const { twilio_account_sid, twilio_api_key_secret, twilio_api_key_sid } =
    addTwilioConfigurationsDto;

  const alreadyExist = await Company.findOne({
    where: {
      id: {
        [Op.ne]: id,
      },
      twilio_account_sid,
      twilio_api_key_secret,
      twilio_api_key_sid,
    },
  });

  if (alreadyExist)
    throw new ConflictException(RESPONSES.alreadyExist('Twilio Settings'));
};

export const checkTwillioNumberExist = async (
  phone_number: string,
  company_id: number,
  id?: number,
) => {
  const where: WhereOptions = { company_id, phone_number };

  if (id) {
    where['id'] = { [Op.ne]: id };
  }

  const twilioNumber = await TwilioNumber.findOne({
    where,
  });

  if (twilioNumber)
    throw new ConflictException(RESPONSES.alreadyExist('Twilio Number'));
};

export const checkEventLinkedTwillioNumberExist = async (
  event_id: number,
  twilio_number_id?: number,
  id?: number,
) => {
  const where: WhereOptions = { event_id, twilio_number_id };

  if (id) {
    where['id'] = { [Op.ne]: id };
  }

  const eventTwilioNumber = await EventTwilioNumbers.findOne({
    where,
  });

  if (eventTwilioNumber)
    throw new ConflictException(
      RESPONSES.alreadyExist('Event Linking with this Twilio Number'),
    );
};

export const getTwilioNumberById = async (id: number, options?: Options) => {
  return await TwilioNumber.findByPk(id, {
    attributes: { exclude: ['updatedAt', 'createdAt'] },
    ...options,
  });
};

export const getEventLinkedNumberById = async (
  id: number,
  options?: Options,
) => {
  return await EventTwilioNumbers.findByPk(id, {
    attributes: { exclude: ['updatedAt', 'createdAt'] },
    include: [
      {
        model: Event,
        required: false,
        attributes: ['id', 'company_id', 'name', 'status'],
      },
      {
        model: TwilioNumber,
        attributes: { exclude: ['updatedAt', 'createdAt'] },
      },
    ],
    ...options,
  });
};
