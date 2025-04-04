import { InventoryZoneQueryParamsDto } from '../dto/inventory-zone-query.dto';

export const getInventoryZoneWhereQuery = (
  filters: InventoryZoneQueryParamsDto,
) => {
  const _where = {};
  const { event_id, filter_by_sequence } = filters;

  _where['event_id'] = event_id;

  if (filter_by_sequence) _where['sequence'] = filter_by_sequence;

  return _where;
};
