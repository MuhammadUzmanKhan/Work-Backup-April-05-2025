/**
 * This file contains all the helper functions related to date, time, timezones, formatting date-time in specific format
 */

import momentTimezone from 'moment-timezone';
import moment from 'moment';
import { Event } from '../models';

/**
 *
 * @param timestamp 2024-08-22T12:00:00Z or 2024-08-22T12:00:00.000Z or 2024-08-22T12:00:00
 * @returns 2024-08-22T12:00:00
 */
export const getOnlyDateTimeFromUtcTimestamp = (timestamp: string) => {
  return timestamp && timestamp.split('.')[0].replace('Z', '');
};

export const checkIfEventDatesInPast = (event: Event) => {
  return (
    Date.now() > new Date(event.public_start_date).getTime() &&
    Date.now() > new Date(event.public_end_date).getTime()
  );
};

/**
 *
 * @param dateTime (2024-07-24 17:00:00 +0500)
 * @param timezone (Asia/Karachi)
 * @returns MM/DD/YYYY hh:mm A (07/24/2024 05:00 PM)
 */
export const formatDateTimeWithTimezone = (
  dateTime: string,
  timezone: string,
): string => {
  return momentTimezone(dateTime, 'YYYY-MM-DD HH:mm:ss Z')
    .tz(timezone)
    .format('MM/DD/YYYY hh:mm A');
};

/**
 *
 * @param timezone
 * @param dateTime
 * @returns string in format '2024-06-02 17:00:00 +0500'
 */
export const getDateTimeWithTimezoneIncluded = (
  timezone: string,
  dateTime: string | Date,
) => {
  return momentTimezone(dateTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss ZZ');
};

/**
 * This function will gate a date in format yyyy-mm-dd and timezone.
 * It converts date with timezone and then returns date and time.
 * @param date
 * @param timezone
 * @returns
 */
export const getDateOrTimeInTimeZone = (
  originalDate: string,
  timezone: string,
) => {
  const dateTimeWithTimeZone = momentTimezone.tz(originalDate, timezone);

  const date = dateTimeWithTimeZone.format('MM/DD/YYYY');
  const time = dateTimeWithTimeZone.format('hh:mm A');

  return { date, time };
};

/**
 * This function will gate a date in format yyyy-mm-dd and timezone.
 * First it will create start and end of day with timezone and then convert it into utc for fetching data according to timezone.
 * @param date
 * @param timezone
 * @returns
 */
export const getStartEndTimezoneUtc = (
  date: string | Date,
  timezone: string,
) => {
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

//To get start time and end time of the day from a given date
export const getStartEndUtcDates = (date?: string) => {
  const startDate = date ? new Date(date) : new Date();
  const endDate = date ? new Date(date) : new Date();

  startDate.setUTCHours(0, 0, 0, 0);

  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
};

export const formatDate = (dateString: string | Date): string => {
  return moment.parseZone(dateString).format('M/D/YYYY');
};
