/**
 * This file contains all the helper functions related to check if record exist in a table against an id
 */

import { NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { Company, Department, Event, User } from '../models';
import { ERRORS, RESPONSES } from '../constants';

export const isDepartmentExist = async (id: number) => {
  const department = await Department.findOne({
    where: { id },
    attributes: ['id', 'name', 'company_id'],
  });

  if (!department)
    throw new NotFoundException(RESPONSES.notFound('Department'));

  return department;
};

export const isUserExist = async (id: number) => {
  const user = await User.findOne({
    where: { id },
    attributes: [
      'id',
      'cell',
      'country_code',
      'email',
      'name',
      'first_name',
      'last_name',
      'status',
      'blocked_at',
      'demo_user',
      'sender_cell',
    ],
  });

  if (!user) throw new NotFoundException(RESPONSES.notFound('User'));

  return user;
};

/**
 * Check if passed event id is valid or not
 * @param eventId
 * @returns error if event not exist
 */
export const isEventExist = async (eventId: number) => {
  const event = await Event.findByPk(eventId, {
    attributes: [
      'id',
      'name',
      'company_id',
      'start_date',
      'end_date',
      'time_zone',
      'short_event_location',
      'location',
      'public_start_date',
      'public_end_date',
      [
        Sequelize.literal(
          `(SELECT name FROM companies where "Event"."company_id"="companies"."id")`,
        ),
        'company_name',
      ],
    ],
  });
  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  return event;
};

/**
 * Check if passed company id is valid or not
 * @param companyId
 * @returns error if company not exist
 */
export const isCompanyExist = async (companyId: number) => {
  const company = await Company.findByPk(companyId, {
    attributes: [
      'id',
      'name',
      'category',
      'parent_id',
      'region_id',
      'default_lang',
    ],
  });
  if (!company) throw new NotFoundException(ERRORS.COMPANY_NOT_FOUND);

  return company;
};
