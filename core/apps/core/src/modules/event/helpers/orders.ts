import { Sequelize } from 'sequelize';
import { Event, UserPins } from '@ontrack-tech-group/common/models';
import {
  EventSortingColumns,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { EventRequestSortingColumns } from '@Common/constants';

export const eventListingOrder = (
  sort_column: EventSortingColumns | EventRequestSortingColumns,
  order: SortBy,
): any => {
  const orderArray: any = [
    [{ model: UserPins, as: 'user_pin_events' }, 'id', SortBy.ASC],
    Event.orderByStatusSequence,
  ];

  if (sort_column) {
    // Push the sorting based on the provided sort_column and order
    orderArray.push([sort_column, order || SortBy.ASC]);
  } else {
    // Push the default two sorting columns
    orderArray.push([
      Sequelize.literal(
        `CASE WHEN "Event"."status" = 1 THEN "Event"."public_start_date" END`,
      ),
      'DESC',
    ]);
    orderArray.push(['public_start_date', SortBy.ASC]);
  }

  return orderArray;
};
