import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Company, EventContact } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  Options,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConflictException } from '@nestjs/common';

export function sendUpdatedEventContact(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.EVENT_CONTACT],
    {
      ...data,
      event_id,
      status,
      type,
      newEntry,
    },
  );
}

export const getEventContact = async (id: number, options?: Options) => {
  return await EventContact.findOne({
    where: { id },
    attributes: {
      include: [[Sequelize.literal(`"company"."name"`), 'company_name']],
    },
    include: [
      {
        model: Company,
        attributes: [],
      },
    ],
    ...options,
  });
};

export const alreadyEventContactExist = async (
  contact_phone: string,
  country_code: string,
  id?: number,
) => {
  const where = { contact_phone, country_code };

  if (id) {
    where['id'] = { [Op.ne]: id };
  }

  const alreadyUserExist = await EventContact.findOne({
    where,
    attributes: ['id'],
  });

  if (alreadyUserExist) throw new ConflictException(ERRORS.USER_CELL_EXIST);
};
