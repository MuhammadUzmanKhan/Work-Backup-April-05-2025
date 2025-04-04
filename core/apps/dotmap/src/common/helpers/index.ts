import { Op } from 'sequelize';
import moment from 'moment-timezone';
import {
  getCompanyScope,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { DotMapDot, User } from '@ontrack-tech-group/common/models';
import { NameCompanyDto } from '@Common/dto';

export * from './name-model';

/**
 *
 * @param date
 * @param timeZone
 * @returns Shift name based on start date and event timezone
 */
export const formatShiftName = (date: string, timeZone: string): string => {
  const shiftTime = moment.utc(date).tz(timeZone);

  return shiftTime.format('M/D dddd h:mm A');
};

/**
 *
 * @param shifts Array of shifts
 * @returns Sum of all shift hours
 */
export const calculateTotalShiftHours = (shifts) => {
  const totalHours = shifts.reduce((accumulator, shift) => {
    const startDate = new Date(shift.start_date);
    const endDate = new Date(shift.end_date);
    const hoursDifference =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60); // convert milliseconds to hours

    return accumulator + hoursDifference;
  }, 0);

  return totalHours;
};

export const getNameAndCompanyWhere = (nameCompanyDto: NameCompanyDto) => {
  const { keyword, company_id } = nameCompanyDto;
  const where = { company_id };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return where;
};

export const commonEventCheckInclude = (event_id: number) => {
  if (event_id) {
    return [
      {
        model: DotMapDot,
        where: { event_id },
        attributes: [],
      },
    ];
  }

  return [];
};

export const checkIfWithinScope = async (
  nameCompanyDto: NameCompanyDto,
  user: User,
) => {
  const { event_id, company_id } = nameCompanyDto;

  if (!event_id) {
    await getCompanyScope(user, company_id);
  } else {
    await withCompanyScope(user, event_id);
  }
};

export const getArrayInChunks = (array: any[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};
