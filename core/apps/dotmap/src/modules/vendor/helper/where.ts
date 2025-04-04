import { Op } from 'sequelize';
import moment from 'moment-timezone';
import { getQueryListParam } from '@ontrack-tech-group/common/helpers';
import { GetAllVendorsDto } from '../dto';

export const getAllVendorsWhere = (getAllVendorsDto: GetAllVendorsDto) => {
  const { keyword, company_id } = getAllVendorsDto;
  const where = { company_id };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return where;
};

export const budgetSummaryWhere = (dates: Date[]) => {
  const where = {};

  // converting dates into array
  const filterDates = getQueryListParam(dates);

  // This means the database will filter rows where the start_date falls within the specified time range for any of the provided dates.
  // getting data on the base of selected dates wihtin the shifts
  if (filterDates?.length) {
    where[Op.or] = filterDates.map((day: string) => {
      const [startDate, endDate] = [
        moment.utc(day).startOf('day').toISOString(),
        moment.utc(day).endOf('day').toISOString(),
      ];

      return {
        '$"dots->shifts"."start_date"$': {
          [Op.between]: [startDate, endDate],
        },
      };
    });
  }

  return where;
};
