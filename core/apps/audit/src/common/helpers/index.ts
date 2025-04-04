/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WhereOptions } from 'sequelize';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import momentTimezone from 'moment-timezone';
import { ERRORS } from '@ontrack-tech-group/common/constants';

/**
 * It takes array of objects and array of props on which array needs to be filter
 * @param object
 * @param props
 * @returns array of objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeUniqueArrayOfObjects = (object: any, props: string[]) => {
  const uniqueSet = new Set();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueObjects: any[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object.forEach((obj: any) => {
    const identifier = props.map((prop) => obj[prop]).join('-');
    if (!uniqueSet.has(identifier)) {
      uniqueSet.add(identifier);
      uniqueObjects.push(obj);
    }
  });

  return uniqueObjects;
};

/**
 * It takes array of objects and array of props to check if array have object with duplicate values
 * @param object
 * @param props
 * @returns array of objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkIfDuplicateExist = (object: any, props: string[]) => {
  const uniqueSet = new Set();
  const uniqueObjects = [];
  let isDuplicate = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object.forEach((obj: any) => {
    const identifier = props.map((prop) => obj[prop]).join('-');

    if (!uniqueSet.has(identifier)) {
      uniqueSet.add(identifier);
      uniqueObjects.push(obj);
    } else {
      isDuplicate = true;
    }
  });

  return isDuplicate;
};

export const getStartEndUtcDates = (date?: string) => {
  const startDate = date ? new Date(date) : new Date();
  const endDate = date ? new Date(date) : new Date();

  startDate.setUTCHours(0, 0, 0, 0);

  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * This function will gate a date in format yyyy-mm-dd and timezone.
 * First it will create start and end of day with timezone and then convert it into utc for fetching data according to timezone.
 * @param date
 * @param timezone
 * @returns
 */
export const getStartEndTimezoneUtc = (date: string, timezone: string) => {
  // Create a moment object for the start of the day in the specific timezone
  const startDateWithTimezone = momentTimezone
    .tz(date, timezone)
    .startOf('day');

  // Create a moment object for the end of the day in the specific timezone
  const endDateWithTimezone = momentTimezone.tz(date, timezone).endOf('day');

  // Convert these times to UTC
  const startDate = startDateWithTimezone.utc().format();
  const endDate = endDateWithTimezone.utc().format();

  return { startDate, endDate };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throwCatchError = (error: any) => {
  if (error.status === 400) {
    throw new BadRequestException(error.message);
  } else if (error.status === 404) {
    throw new NotFoundException(error.message);
  } else if (error.status === 401) {
    throw new UnauthorizedException(error.message);
  } else {
    throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
  }
};

export const staffWhere = (priority?: boolean) => {
  const where: WhereOptions = {};

  if (priority) {
    where['priority'] = priority;
  }

  return where;
};
