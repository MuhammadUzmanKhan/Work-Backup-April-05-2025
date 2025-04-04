import {
  UserIncidentDivision,
  Department,
  Event,
  IncidentDivision,
} from '@ontrack-tech-group/common/models';
import { Op, Sequelize } from 'sequelize';
import { GetStaffScheduleDto } from '../dto';

export const getSchduleListingWhere = (
  keyword: string,
  event_id: number,
  date: string,
) => {
  let _where = {};

  const targetDate = new Date(date);

  if (date) {
    _where[Op.or] = [
      {
        [Op.and]: [
          { shift_start_time: { [Op.gte]: targetDate } },
          {
            shift_start_time: {
              [Op.lt]: new Date(targetDate.getTime() + 86400000), // To cover 24 hours
            },
          },
        ],
      },
      {
        [Op.and]: [
          { shift_end_time: { [Op.gte]: targetDate } },
          {
            shift_end_time: {
              [Op.lt]: new Date(targetDate.getTime() + 86400000), // To cover 24 hours
            },
          },
        ],
      },
    ];
  }

  _where['event_id'] = event_id;
  if (keyword) {
    _where = Sequelize.literal(
      `"user"."name" ILIKE'%${keyword.toLowerCase()}%'`,
    );
  }
  return _where;
};

export const getStaffListingIncludeModel = (
  department_id: number,
  division_id: number,
  event_id: number,
) => {
  const include = [];

  if (department_id) {
    include.push({
      model: Department,
      where: { id: department_id },
      attributes: [],
      through: { attributes: [] },
      required: true,
      include: [
        {
          model: Event,
          where: { id: event_id },
          attributes: [],
          through: { attributes: [] },
          required: true,
        },
      ],
    });
  }

  if (division_id) {
    include.push({
      model: UserIncidentDivision,
      where: {
        ...(division_id
          ? {
              incident_division_id: division_id,
            }
          : {}),
        ...{ event_id: event_id },
      },
      attributes: [],
      required: !!division_id,
      include: [
        {
          model: IncidentDivision,
          attributes: [],
        },
      ],
    });
  }

  return include;
};

export const getUnscheduleEventUsersWhereFilter = (
  filters: GetStaffScheduleDto,
  userIds: number[],
) => {
  let _where = {};

  _where['id'] = { [Op.notIn]: userIds };

  if (filters.keyword) {
    _where = Sequelize.literal(
      `"User"."name" ILIKE'%${filters.keyword.toLowerCase()}%'`,
    );
  }

  return _where;
};
