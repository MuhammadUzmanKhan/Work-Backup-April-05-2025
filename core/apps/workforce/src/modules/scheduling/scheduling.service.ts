import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  Department,
  Event,
  EventUser,
  IncidentDivision,
  StaffEventSchedule,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import { ERRORS, SortBy } from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import { _ERRORS } from '@Common/constants';

import {
  AssignShiftToStaffScheduleDto,
  GetStaffScheduleDto,
  UpdateShiftScheduleDto,
} from './dto/index';
import {
  getSchduleListingWhere,
  getStaffListingIncludeModel,
  getUnscheduleEventUsersWhereFilter,
} from './helpers';

@Injectable()
export class SchedulingService {
  async assignShiftToStaff(assignShiftToStaff: AssignShiftToStaffScheduleDto) {
    const { event_id, shift_end_time, shift_start_time } = assignShiftToStaff;

    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'start_date', 'end_date'],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    if (shift_start_time >= shift_end_time)
      throw new BadRequestException(
        _ERRORS.SHIFT_END_TIME_SHOULD_BE_GREATER_THAN_SHIFT_START_TIME,
      );

    const staffEventSchedule = await StaffEventSchedule.create({
      ...assignShiftToStaff,
    });

    return staffEventSchedule;
  }

  async staffShiftListing(getStaffSchedule: GetStaffScheduleDto) {
    const { event_id, keyword, department_id, division_id, date } =
      getStaffSchedule;

    const [page, page_size] = getPageAndPageSize(
      getStaffSchedule.page,
      getStaffSchedule.page_size,
    );

    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'start_date', 'end_date'],
    });
    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const staffSchedule = await StaffEventSchedule.findAndCountAll({
      where: getSchduleListingWhere(keyword, event_id, date),
      attributes: [
        'id',
        'shift_start_time',
        'shift_end_time',
        [Sequelize.literal('"user"."id"'), 'user_id'],
        [Sequelize.literal('"user"."name"'), 'name'],
        [Sequelize.literal('"event"."id"'), 'event_id'],
        [Sequelize.literal('"event"."start_date"'), 'operational_start_date'],
        [Sequelize.literal('"event"."end_date"'), 'operational_end_date'],
      ],
      include: [
        {
          model: User,
          attributes: [],
          include: getStaffListingIncludeModel(
            department_id,
            division_id,
            event_id,
          ),
        },
        {
          model: Event,
          attributes: [],
        },
      ],
      limit: page_size || undefined,
      offset: page_size * page || undefined,
      order: [
        [
          getStaffSchedule.sort_column || 'createdAt',
          getStaffSchedule.order || SortBy.DESC,
        ],
      ],
    });

    const { rows, count } = staffSchedule;

    return {
      data: rows,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getUnscheduledStaff(getStaffSchedule: GetStaffScheduleDto) {
    const { event_id, department_id, division_id } = getStaffSchedule;
    const [page, page_size] = getPageAndPageSize(
      getStaffSchedule.page,
      getStaffSchedule.page_size,
    );

    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'start_date', 'end_date'],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const staffListing = await this.staffShiftListing(getStaffSchedule);

    const userIds = staffListing.data.map((data) => {
      return data.user_id;
    });

    const staffSchedule = await User.findAndCountAll({
      where: getUnscheduleEventUsersWhereFilter(getStaffSchedule, userIds),
      attributes: [
        'id',
        'name',
        [Sequelize.literal('"events"."start_date"'), 'operational_start_date'],
        [Sequelize.literal('"events"."end_date"'), 'operational_end_date'],
      ],
      include: [
        {
          model: Event,
          as: 'events',
          where: { id: event_id },
          required: true,
          attributes: [],
        },
        {
          model: EventUser,
          where: { event_id: event_id },
          required: true,
          attributes: [],
        },
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
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
        },
        {
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
        },
      ],
      order: [['name', SortBy.ASC]],
      limit: page_size || undefined,
      offset: page_size * page || undefined,
      distinct: true,
    });

    const { rows, count } = staffSchedule;

    return {
      data: rows,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async updateShift(id: number, updateShift: UpdateShiftScheduleDto) {
    const { shift_end_time, shift_start_time } = updateShift;

    if (shift_start_time >= shift_end_time)
      throw new BadRequestException(
        _ERRORS.SHIFT_END_TIME_SHOULD_BE_GREATER_THAN_SHIFT_START_TIME,
      );

    const staffSchedule = await StaffEventSchedule.findByPk(id);

    if (!staffSchedule) throw new NotFoundException('Staff Schedule Not Found');

    await StaffEventSchedule.update(
      {
        ...updateShift,
      },
      { where: { id } },
    );

    return staffSchedule;
  }
}
