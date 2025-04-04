import { getStartEndTimezoneUtc } from '@ontrack-tech-group/common/helpers';
import { Op, WhereOptions } from 'sequelize';

import { AttendanceAuditDto, PositionCountDto } from '../dto';

export const getShiftsWhere = (
  attendanceAuditDto: AttendanceAuditDto | PositionCountDto,
  timezone: string,
): WhereOptions => {
  const { date, dates, event_id } = attendanceAuditDto;
  const where: WhereOptions = { event_id };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDateRanges: any[] = [];

  if (date) {
    const { startDate, endDate } = getStartEndTimezoneUtc(date, timezone);

    where['start_date'] = { [Op.between]: [startDate, endDate] };
  }

  if (dates && timezone) {
    dates.forEach((date) => {
      const { startDate, endDate } = getStartEndTimezoneUtc(date, timezone);
      startDateRanges.push({
        [Op.between]: [startDate, endDate],
      });
    });

    where['start_date'] = { [Op.or]: startDateRanges };
  }

  return where;
};

export const shiftWhere = ({
  id,
  event_id,
  dates,
  timezone,
}: {
  id?: number;
  event_id?: number;
  dates?: string[];
  timezone?: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDateRanges: any[] = [];

  if (dates && timezone) {
    dates.forEach((date) => {
      const { startDate, endDate } = getStartEndTimezoneUtc(date, timezone);
      startDateRanges.push({
        [Op.between]: [startDate, endDate],
      });
    });

    where['start_date'] = { [Op.or]: startDateRanges };
  }

  if (event_id) {
    where['event_id'] = event_id;
  }

  if (id) {
    where['id'] = id;
  }

  return where;
};
