import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { Day } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import { DayQueryParamsDto } from './dto';

@Injectable()
export class DayService {
  async getAllDays(dayQueryParamsDto: DayQueryParamsDto) {
    const { page, page_size, event_id } = dayQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const eventDays = await Day.findAndCountAll({
      where: {
        event_id,
      },
      attributes: [
        'id',
        'calendar_day',
        'ends_at',
        'day_scan',
        'start_time',
        'end_time',
        'created_at',
        [Day.getTypeNameByKey, 'date_type'],
        'event_id',
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "user_shifts"
            WHERE "user_shifts"."day_id" = "Day"."id"
          )`),
          'has_driver_scheduled',
        ],
        [
          Sequelize.literal(`
            COALESCE(
              (
                SELECT COUNT(*) FROM "day_routes" 
                INNER JOIN "routes" ON "routes"."id" = "day_routes"."route_id" AND "day_routes"."day_id" = "Day"."id"
              ),
              0
            ) - 
            COALESCE(
              (
                SELECT COUNT(*) FROM "user_shifts" 
                INNER JOIN "users" ON "users"."id" = "user_shifts"."user_id" 
                WHERE "user_shifts"."day_id" = "Day"."id"
              ),
              0
            ) > 0
          `),
          'has_empty_shift',
        ],
      ],
      order: [['createdAt', SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = eventDays;

    return {
      data: rows,
      pagination: calculatePagination(count, page_size, page),
    };
  }
}
