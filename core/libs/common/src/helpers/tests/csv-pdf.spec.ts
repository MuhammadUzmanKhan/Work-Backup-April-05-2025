import { EventStatusMap } from '../../constants';
import { Company, Event } from '../../models';
import { createFixture, sequelizeTest } from '../../services/fixture';
import {
  getFormattedCompanyDataForCsv,
  getFormattedEventDataForCsv,
  getFormattedsubcompanyDataForCsv,
} from '../csv-pdf';

describe('helper', () => {
  describe('csv-pdf', () => {
    it('should return formated event data for csv', async () => {
      await sequelizeTest();

      const mockEvent: Event[] = createFixture('Event', 3) as Event[];

      const expectedResult = mockEvent.map((event) => {
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

      expect(getFormattedEventDataForCsv(mockEvent)).toStrictEqual(
        expectedResult,
      );
    });

    it('should return formated company data for csv', async () => {
      await sequelizeTest();

      const mockCompany: Company[] = createFixture('Company', 3) as Company[];

      const expectedResult = mockCompany.map((company) => ({
        Company: company.name,
        Country: company.country || '--',
        Parent: (company['parentCompany'] as string) || '--',
        'Sub Companies': company['subcompaniesCount'],
        EventCount: company['totalEventsCount'],
      }));

      expect(getFormattedCompanyDataForCsv(mockCompany)).toStrictEqual(
        expectedResult,
      );
    });

    it('should return formated sub-company data for csv', async () => {
      await sequelizeTest();

      const mockCompany: Company[] = createFixture('Company', 2) as Company[];

      const expectedResult = mockCompany.map((company) => ({
        Companies: company.name,
        Country: company.country || '--',
        'Active Events': !company.events.length
          ? '--'
          : `${company.events.map((event) => event.name).join(', ')}`,

        'Total Events': company['totalCount'],
      }));

      expect(getFormattedsubcompanyDataForCsv(mockCompany)).toStrictEqual(
        expectedResult,
      );
    });
  });
});
