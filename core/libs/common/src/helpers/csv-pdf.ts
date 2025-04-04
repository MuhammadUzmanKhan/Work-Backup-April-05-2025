/**
 * This file contains all the helper functions related to csv and pdfs
 */

import { Sequelize } from 'sequelize';
import * as Papa from 'papaparse';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, NotFoundError } from 'rxjs';
import { ERRORS, EventStatusMap } from '../constants';
import { Company, Department, Event, IncidentDivision, User } from '../models';

/**
 * The data showing in listing needs to be download in csv as well.
 * @param events
 * @returns Formatted object for CSV file for events.
 */
export const getFormattedEventDataForCsv = (events: Event[]) => {
  return events.map((event: Event) => {
    const genre = [];

    if (event.key_genre) genre.push(event.key_genre);
    if (event.genre) genre.push(event.genre);
    if (event.sub_genre) genre.push(event.sub_genre);

    return {
      'Event Name': `${event.name} (${event['company_name']})`,
      Location: event.short_event_location || 'N/A',
      'Event Venue': event.venue_name || 'N/A',
      'Event Date': `From ${event.start_date}, To ${event.end_date}`,
      'Time Zone': event.time_zone || 'N/A',
      'Event Genre': genre.length ? genre.join(', ') : 'N/A',
      'Show Status':
        (event.status &&
          EventStatusMap[event.status.toString().toUpperCase()]) ||
        'N/A',
    };
  });
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param companies
 * @returns Formatted object for CSV file for companies.
 */
export const getFormattedCompanyDataForCsv = (companies: Company[]) => {
  return companies.map((company: Company) => {
    return {
      Company: company.name,
      Country: company.country || '--',
      Parent: (company['parentCompany'] as string) || '--',
      'Sub Companies': company['subcompaniesCount'],
      EventCount: company['totalEventsCount'],
    };
  });
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param companies
 * @returns Formatted object for CSV file for subcompanies.
 */
export const getFormattedsubcompanyDataForCsv = (subcompanies: Company[]) => {
  return subcompanies?.map((company: Company) => {
    return {
      Companies: company.name,
      Country: company.country || '--',
      'Active Events': !company.events.length
        ? '--'
        : `${company.events.map((event) => event.name).join(', ')}`,

      'Total Events': company['totalCount'],
    };
  });
};

/**
 *
 * @param event
 * @returns Formatted event for pdf report
 */
export const getFormattedEventForPdf = (event: Event) => {
  return {
    name: event.name || '--',
    url: event.url || '--',
    key_genre: event.key_genre || '--',
    genre: event.genre || '--',
    sub_genre: event.sub_genre || '--',
    about_event: event.about_event || '--',
    venue: event.venue_name || '--',
    location: event.event_location || '--',
    time_zone: event.time_zone || '--',
    event_date: `${event.start_date} To ${event.end_date}`,
    transportation_future: event.transportation_future,
    workforce_messaging: event.workforce_messaging,
    vendor_future: event.vendor_future,
    staff_future: event.staff_future,
    show_block: event.show_block,
    service_request_future: event.service_request_future,
    reservation_future: event.reservation_future,
    messaging_capability: event.messaging_capability,
    message_service: event.message_service,
    lost_and_found_future: event.lost_and_found_future,
    inventory_future: event.inventory_future,
    incident_future: event.incident_future,
    incident_future_v2: event.incident_future_v2,
    reporting_future: event.reporting_future,
    guest_messaging: event.guest_messaging,
    dot_map_service: event.dot_map_service,
    dot_map_service_v2: event.dot_map_service_v2,
    deposit_full_charges: event.deposit_full_charges,
    department_future: event.department_future,
    camping_future: event.camping_future,
    company_name: event['company_name'],
    task_future: event.task_future,
    ticket_clear_template_future: event.ticket_clear_template_future,
    event_form_future: event.event_form_future,
    audit_future: event.audit_future,
  };
};

/**
 * The data showing in listing needs to be download in pdf as well.
 * @param companies
 * @returns Formatted object for PDF file for companies.
 */
export const getFormattedCompanyDataForPdf = (companies: Company[]) => {
  return companies.map((company: Company) => {
    return {
      company: company.name,
      country: company.country || '--',
      parent: (company['parentCompany'] as string) || '--',
      subcompanies: company['subcompaniesCount'],
      eventcount: company['totalEventsCount'],
    };
  });
};

/**
 * The data showing in listing needs to be download in pdf as well.
 * @param companies
 * @returns Formatted object for PDF file for subcompanies.
 */
export const getFormattedSubcompanyDataForPdf = (subcompanies: Company[]) => {
  return subcompanies.map((company: Company) => {
    return {
      parent: company['parentCompany'],
      name: company.name,
      country: company.country || '--',
      activeEvents: !company.events.length
        ? ['--']
        : company.events.map((event) => event.name),

      totalEvents: company['totalCount'],
    };
  });
};

export const getEventForPdfs = async (
  eventId: number,
  sequelize: Sequelize,
): Promise<Event> => {
  const event = await Event.findOne({
    where: { id: eventId },
    attributes: [
      'name',
      [sequelize.literal(`to_char(start_date, 'FMMM/FMDD/YY')`), 'start_date'],
      [sequelize.literal(`to_char(end_date, 'FMMM/FMDD/YY')`), 'end_date'],
      'event_location',
      'time_zone',
    ],
    raw: true,
  });

  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  return event;
};

export const parseCsvForTypes = async (file: any, httpService: HttpService) => {
  let parsedFileData = [];

  try {
    parsedFileData = await parseCSV(file, httpService);
  } catch (error) {
    throw new BadRequestException(ERRORS.FILE_IS_NOT_PARSED_CORRECTLY);
  }

  return parsedFileData;
};

export const parseCSV = async (
  url: string,
  httpService: HttpService,
): Promise<any[]> => {
  const { data } = await firstValueFrom(httpService.get(url));

  return new Promise((resolve, reject) => {
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

export const jsonToCSV = (data: string) => {
  return Papa.unparse(data, { header: true });
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param users
 * @returns Formatted object for CSV file for users.
 */
export const getFormattedStaffListingDataForCsv = (
  users: User[],
  addCompanyName?: boolean,
) => {
  return users.map((user: User) => {
    const _user = user.get({ plain: true });
    return {
      'First Name': _user.first_name || '--',
      'Last Name': _user.last_name || '--',
      Department: _user['department_name'] || '--',
      Division: _user['division_name'] || '--',
      ...(addCompanyName ? { 'Company Name': _user.company_name || '--' } : {}),
      Email: _user.email || '--',
      'Country Code': _user.country_code || '--',
      Phone: _user.cell || '--',
      Role: _user.role || '--',
    };
  });
};

export const uploadTypesCsvHeaderNames = async (rows) => {
  const _rows = rows.map((obj) => {
    const transformedObj = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keyTrimmed = key.trim();
        const newKey =
          keyTrimmed.charAt(0).toUpperCase() +
          keyTrimmed.slice(1).toLowerCase();
        transformedObj[newKey] = obj[key];
      }
    }

    if (!transformedObj['Name'])
      throw new UnprocessableEntityException(ERRORS.NAME_IS_REQUIRED);

    if (transformedObj['Priority']) {
      const priority = transformedObj['Priority'].toString().toLowerCase();

      if (['low', 'medium', 'high', 'critical'].includes(priority)) {
        transformedObj['Priority'] =
          priority === 'medium' ? 'normal' : priority;
      } else {
        throw new UnprocessableEntityException(
          `${ERRORS.PRIORITY_INVALID}: ${transformedObj['Priority']}`,
        );
      }
    }

    return transformedObj;
  });

  rows = _rows;

  const headerMapping = {
    Name: 'name',
    Priority: 'default_priority',
  };

  return rows.map((obj) =>
    Object.entries(obj).reduce((acc, [key, value]) => {
      const updatedKey = headerMapping[key.trim()];
      if (updatedKey) return { ...acc, [updatedKey]: value };
      else return acc;
    }, {}),
  );
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param departments
 * @returns Formatted object for CSV file for departments.
 */
export const getFormattedDepartmentsCardViewDataForCsv = (
  departments: Department[],
) => {
  return departments.map((department: Department) => {
    return {
      Name: department.name || '--',
      Divisions: department['divisions'] || 0,
      'Total Staff': department['staff_count'] || 0,
      'Available Staff': department['active_staff'] || 0,
      'Unavailable Staff':
        (department['staff_count'] || 0) - (department['active_staff'] || 0),
    };
  });
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param divisions
 * @returns Formatted object for CSV file for divisions.
 */
export const getFormattedDivisionsCardViewDataForCsv = (
  divisions: IncidentDivision[],
) => {
  return divisions.map((division: IncidentDivision) => {
    const _division = division.get({ plain: true });

    return {
      Name: _division.name || '--',
      'Department Count': _division['department_count'] || 0,
      'Staff Count': _division['staff_count'] || 0,
    };
  });
};
