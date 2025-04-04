import { Order, Sequelize } from 'sequelize';
import { SortBy } from '@ontrack-tech-group/common/constants';

import { PositionDataEnum } from './enums';
import {
  CHECKED_OUT,
  CURRENT_CHECKED_IN_STAFF,
  TOTAL_CHECKED_IN_PERCENTAGE_NUMERIC,
  TOTAL_CHECKED_IN_STAFF,
  TOTAL_CHECKED_OUT_PERCENTAGE_NUMERIC,
  TOTAL_STAFF_COUNT,
} from './constants';

export const positionDetailsDataOrder = (
  sort_by: PositionDataEnum,
  order: SortBy,
): Order => {
  const column = getColumnBySort(sort_by);
  return [[Sequelize.literal(column), order]];
};

const getColumnBySort = (sort_by: PositionDataEnum): string => {
  switch (sort_by) {
    case PositionDataEnum.ID:
      return 'id';
    case PositionDataEnum.NAME:
      return 'name';
    case PositionDataEnum.TOTAL_ORDER:
      return TOTAL_STAFF_COUNT;
    case PositionDataEnum.CURRENT_CHECKED_IN:
      return CURRENT_CHECKED_IN_STAFF;
    case PositionDataEnum.CHECKED_IN:
      return TOTAL_CHECKED_IN_STAFF;
    case PositionDataEnum.CHECKED_IN_PERCENTAGE:
      return TOTAL_CHECKED_IN_PERCENTAGE_NUMERIC;
    case PositionDataEnum.CHECKED_OUT_PERCENTAGE:
      return TOTAL_CHECKED_OUT_PERCENTAGE_NUMERIC;
    case PositionDataEnum.CHECKED_OUT:
      return CHECKED_OUT;
    default:
      return 'name'; // Default sorting column (fallback)
  }
};
